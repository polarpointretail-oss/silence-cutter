// Web Audio API based silence cutter
class SilenceCutter {
    constructor() {
        this.files = [];
        this.results = [];
        this.ffmpeg = null;
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFFmpeg();
    }
    
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.filesSection = document.getElementById('filesSection');
        this.filesList = document.getElementById('filesList');
        this.processBtn = document.getElementById('processBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsList = document.getElementById('resultsList');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        
        // Settings elements
        this.thresholdSlider = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('thresholdValue');
        this.durationSlider = document.getElementById('minSilenceDuration');
        this.durationValue = document.getElementById('durationValue');
    }
    
    setupEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Settings
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = `${e.target.value} dB`;
        });
        this.durationSlider.addEventListener('input', (e) => {
            this.durationValue.textContent = `${e.target.value} seconds`;
        });
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processFiles());
        
        // Download all button
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }
    
    async loadFFmpeg() {
        try {
            this.progressText.textContent = 'Loading FFmpeg...';
            this.progressFill.style.width = '10%';
            
            // Load FFmpeg.wasm
            const { FFmpeg } = FFmpegWASM;
            this.ffmpeg = new FFmpeg();
            await this.ffmpeg.load();
            
            this.progressText.textContent = 'FFmpeg loaded successfully!';
            this.progressFill.style.width = '100%';
            
            setTimeout(() => {
                this.progressSection.style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            this.progressText.textContent = 'Failed to load FFmpeg. Please refresh the page.';
        }
    }
    
    handleFiles(fileList) {
        const audioFiles = Array.from(fileList).filter(file => 
            file.type.startsWith('audio/') || 
            file.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i)
        );
        
        if (audioFiles.length === 0) {
            alert('Please select valid audio files (MP3, WAV, M4A, OGG, FLAC)');
            return;
        }
        
        this.files = [...this.files, ...audioFiles];
        this.updateFilesList();
        this.filesSection.style.display = 'block';
    }
    
    updateFilesList() {
        this.filesList.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileSize = this.formatFileSize(file.size);
            const duration = this.formatDuration(file.duration || 0);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">🎵</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${fileSize} • ${duration}</p>
                    </div>
                </div>
                <button class="remove-file" onclick="silenceCutter.removeFile(${index})">Remove</button>
            `;
            
            this.filesList.appendChild(fileItem);
        });
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFilesList();
        
        if (this.files.length === 0) {
            this.filesSection.style.display = 'none';
        }
    }
    
    async processFiles() {
        if (this.isProcessing || this.files.length === 0) return;
        
        this.isProcessing = true;
        this.progressSection.style.display = 'block';
        this.results = [];
        
        const threshold = parseInt(this.thresholdSlider.value);
        const minDuration = parseFloat(this.durationSlider.value);
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            
            try {
                this.progressText.textContent = `Processing ${file.name}...`;
                this.progressFill.style.width = `${((i + 1) / this.files.length) * 100}%`;
                
                const result = await this.processFile(file, threshold, minDuration);
                this.results.push(result);
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                this.results.push({
                    originalFile: file,
                    error: error.message,
                    success: false
                });
            }
        }
        
        this.isProcessing = false;
        this.progressSection.style.display = 'none';
        this.showResults();
    }
    
    async processFile(file, threshold, minDuration) {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Write file to FFmpeg
        await this.ffmpeg.writeFile(file.name, new Uint8Array(arrayBuffer));
        
        // Run silence detection
        const silenceCmd = [
            '-i', file.name,
            '-af', `silencedetect=noise=${threshold}dB:d=${minDuration}`,
            '-f', 'null', '-'
        ];
        
        await this.ffmpeg.exec(silenceCmd);
        
        // Get the output to analyze silence
        const silenceOutput = await this.ffmpeg.readFile('stderr');
        const silenceText = new TextDecoder().decode(silenceOutput);
        
        // Parse silence detection results
        const silenceData = this.parseSilenceOutput(silenceText);
        
        // Get file duration
        const durationCmd = [
            '-i', file.name,
            '-show_entries', 'format=duration',
            '-of', 'default=nk=1:nw=1'
        ];
        
        await this.ffmpeg.exec(durationCmd);
        const durationOutput = await this.ffmpeg.readFile('stdout');
        const durationText = new TextDecoder().decode(durationOutput);
        const totalDuration = parseFloat(durationText.trim());
        
        // Calculate trim points
        const startTime = Math.max(0, (silenceData.firstSilenceEnd || 0) - 0.005);
        const endTime = silenceData.lastSilenceStart ? 
            Math.min(totalDuration, silenceData.lastSilenceStart + 0.005) : 
            totalDuration;
        
        const duration = Math.max(0.01, endTime - startTime);
        
        // Trim the audio
        const outputName = `cleaned_${file.name}`;
        const trimCmd = [
            '-y',
            '-ss', startTime.toFixed(3),
            '-i', file.name,
            '-t', duration.toFixed(3),
            '-c:a', 'pcm_s16le',
            outputName
        ];
        
        await this.ffmpeg.exec(trimCmd);
        
        // Read the output file
        const outputData = await this.ffmpeg.readFile(outputName);
        
        return {
            originalFile: file,
            outputData: outputData,
            outputName: outputName,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            success: true
        };
    }
    
    parseSilenceOutput(output) {
        const ends = [...output.matchAll(/silence_end:\s*([\d.]+)/g)];
        const starts = [...output.matchAll(/silence_start:\s*([\d.]+)/g)];
        
        return {
            firstSilenceEnd: ends.length ? parseFloat(ends[0][1]) : null,
            lastSilenceStart: starts.length ? parseFloat(starts[starts.length - 1][1]) : null
        };
    }
    
    showResults() {
        this.resultsList.innerHTML = '';
        
        this.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            if (result.success) {
                const originalDuration = result.originalFile.duration || 0;
                const savedTime = originalDuration - result.duration;
                
                resultItem.innerHTML = `
                    <div class="result-info">
                        <div class="result-icon">✅</div>
                        <div class="result-details">
                            <h4>${result.originalFile.name}</h4>
                            <p>Trimmed ${savedTime.toFixed(2)}s • New duration: ${result.duration.toFixed(2)}s</p>
                        </div>
                    </div>
                    <a href="#" class="download-btn" onclick="silenceCutter.downloadFile(${index})">Download</a>
                `;
            } else {
                resultItem.innerHTML = `
                    <div class="result-info">
                        <div class="result-icon">❌</div>
                        <div class="result-details">
                            <h4>${result.originalFile.name}</h4>
                            <p>Error: ${result.error}</p>
                        </div>
                    </div>
                `;
            }
            
            this.resultsList.appendChild(resultItem);
        });
        
        this.resultsSection.style.display = 'block';
    }
    
    downloadFile(index) {
        const result = this.results[index];
        if (!result.success) return;
        
        const blob = new Blob([result.outputData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = result.outputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    downloadAll() {
        this.results.forEach((result, index) => {
            if (result.success) {
                setTimeout(() => this.downloadFile(index), index * 100);
            }
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDuration(seconds) {
        if (seconds === 0) return 'Unknown duration';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the app when the page loads
let silenceCutter;
document.addEventListener('DOMContentLoaded', () => {
    silenceCutter = new SilenceCutter();
});
