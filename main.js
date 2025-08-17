const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');                 // bundled ffmpeg
const ffprobe = require('ffprobe-static').path;          // bundled ffprobe

function createWindow() {
  const win = new BrowserWindow({
    width: 640,
    height: 440,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

/* ---------- helpers ---------- */

// Run a process and capture stdout/stderr
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: 'utf8', stdio: 'pipe' });
  const status = r.status ?? (r.error ? 1 : 0);
  return { status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// Write ffmpeg concat list file
function writeConcatList(files, listPath) {
  const lines = files
    .map(p => `file '${String(p).replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listPath, lines);
}

// Get total duration via ffprobe
function getDuration(filePath) {
  const { status, stdout, stderr } = run(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nk=1:nw=1',
    filePath
  ]);
  if (status !== 0) throw new Error(`ffprobe failed: ${stderr.slice(0, 300)}`);
  const val = parseFloat(String(stdout).trim());
  if (!isFinite(val)) throw new Error('Invalid duration from ffprobe');
  return val;
}

// Detect first silence end and last silence start with silencedetect
function detectSilence(filePath, thresholdDb = -30) {
  // ffmpeg prints silencedetect logs to STDERR
  const { status, stderr } = run(ffmpeg, [
    '-i', filePath,
    '-af', `silencedetect=noise=${thresholdDb}dB:d=0.01`,
    '-f', 'null', '-'
  ]);

  // Even if status != 0, logs may contain the data we need.
  const ends   = [...String(stderr).matchAll(/silence_end:\s*([\d.]+)/g)];
  const starts = [...String(stderr).matchAll(/silence_start:\s*([\d.]+)/g)];

  return {
    firstSilenceEnd: ends.length ? parseFloat(ends[0][1]) : null,
    lastSilenceStart: starts.length ? parseFloat(starts[starts.length - 1][1]) : null
  };
}

/* ---------- main flow ---------- */

ipcMain.handle('pick-and-clean-many', async () => {
  const sel = await dialog.showOpenDialog({
    title: 'Select MP3s (oldest files will go first)',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3'] }]
  });
  if (sel.canceled || sel.filePaths.length === 0) {
    return { ok: false, message: 'No files selected.' };
  }

  // ORDER: by file creation time (oldest first)
  const ordered = [...sel.filePaths].sort((a, b) => {
    const aStat = fs.statSync(a);
    const bStat = fs.statSync(b);
    return aStat.birthtimeMs - bStat.birthtimeMs;
  });

  const firstDir    = path.dirname(ordered[0]);
  const outDir      = path.join(firstDir, 'output');
  const listPath    = path.join(outDir, 'concat_list.txt');
  const combinedMp3 = path.join(outDir, 'combined_raw.mp3');
  const finalWav    = path.join(outDir, 'combined_cleaned.wav');

  try {
    fs.mkdirSync(outDir, { recursive: true });

    // 1) Concatenate MP3s (try stream copy first, then re-encode if needed)
    writeConcatList(ordered, listPath);

    let r = run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', combinedMp3]);
    const badCopy = r.status !== 0 || !fs.existsSync(combinedMp3) || fs.statSync(combinedMp3).size === 0;

    if (badCopy) {
      r = run(ffmpeg, [
        '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
        '-acodec', 'libmp3lame', '-b:a', '192k',
        combinedMp3
      ]);
      if (r.status !== 0) throw new Error(`Failed to concatenate MP3s: ${r.stderr.slice(0, 300)}`);
    }

    // 2) Probe duration
    const totalDuration = getDuration(combinedMp3);

    // 3) Detect silence
    let firstSilenceEnd = null;
    let lastSilenceStart = null;
    try {
      const det = detectSilence(combinedMp3, -30);
      firstSilenceEnd = det.firstSilenceEnd;
      lastSilenceStart = det.lastSilenceStart;
    } catch {
      // proceed without trims if detection fails
    }

    // 4) Compute trim points with ±5ms pad
    const startTime = Math.max(0, (firstSilenceEnd || 0) - 0.005);
    const endTime   = lastSilenceStart ? lastSilenceStart + 0.005 : totalDuration;

    // Ensure positive duration; if edge case, fall back to full from start
    let durationSec = Math.max(0, endTime - startTime);
    if (!isFinite(durationSec) || durationSec <= 0.01) {
      durationSec = Math.max(0.01, totalDuration - startTime);
    }

    // 5) Trim with portable args: -ss <start>, -t <duration>, output WAV (pcm_s16le)
    const trim = run(ffmpeg, [
      '-y',
      '-ss', startTime.toFixed(3),
      '-i', combinedMp3,
      '-t', durationSec.toFixed(3),
      '-c:a', 'pcm_s16le',
      finalWav
    ]);
    if (trim.status !== 0) {
      throw new Error(`Trim step failed: ${trim.stderr.slice(0, 400)}`);
    }

    // 6) Cleanup minor artifacts
    if (fs.existsSync(listPath)) fs.unlinkSync(listPath);

    return {
      ok: true,
      outputs: [finalWav],
      info: {
        ordered,
        totalDuration,
        startTime,
        durationSec
      }
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
