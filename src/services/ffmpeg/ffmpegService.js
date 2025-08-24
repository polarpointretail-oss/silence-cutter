import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Create FFmpeg instance
const ffmpeg = new FFmpeg();

// Load FFmpeg
let ffmpegLoadingPromise = null;

/**
 * Ensures FFmpeg is loaded
 * @returns {Promise<void>}
 */
const ensureFFmpegLoaded = async () => {
  try {
    // Check for SharedArrayBuffer support (required for audio processing)
    if (typeof SharedArrayBuffer === "undefined") {
      throw new Error(
        "SharedArrayBuffer is not supported in this browser. This is required for audio processing to work."
      );
    }

    // Check for WebAssembly support
    if (typeof WebAssembly === "undefined") {
      throw new Error(
        "WebAssembly is not supported in this browser. This is required for audio processing to work."
      );
    }

    // Check if already loaded
    if (ffmpeg.loaded) {
      console.log("Audio processor already loaded");
      return Promise.resolve();
    }

    if (!ffmpegLoadingPromise) {
      console.log("Loading audio processor...");

      try {
        // Use local files instead of CDN URLs
        console.log("Loading audio processor from local files");

        // Set up event listeners like in the working example
        ffmpeg.on("log", ({ message }) => {
          console.log("FFmpeg log:", message);
        });

        ffmpeg.on("progress", (ratio) => {
          console.log("FFmpeg progress:", ratio);
        });

        // Use local files with toBlobURL to avoid Vite import issues
        await ffmpeg.load({
          coreURL: await toBlobURL(
            "/ffmpeg-core-mt/ffmpeg-core.js",
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            "/ffmpeg-core-mt/ffmpeg-core.wasm",
            "application/wasm"
          ),
          workerURL: await toBlobURL(
            "/ffmpeg-core-mt/ffmpeg-core.worker.js",
            "text/javascript"
          ),
        });

        console.log("Audio processor loaded successfully from local files");
        ffmpegLoadingPromise = Promise.resolve();
      } catch (error) {
        console.error("Failed to load audio processor:", error);
        throw error;
      }
    }

    await ffmpegLoadingPromise;
    return ffmpegLoadingPromise;
  } catch (error) {
    console.error("Error loading audio processor:", error);
    throw new Error(
      "Failed to load audio processor: " + (error.message || "Unknown error")
    );
  }
};

/**
 * Concatenates multiple audio files
 * @param {File[]} audioFiles - Array of audio files to concatenate (sorted by creation time)
 * @returns {Promise<Uint8Array>} - Concatenated audio as Uint8Array
 */
export const concatenateAudioFiles = async (audioFiles) => {
  try {
    console.log("Starting concatenation of", audioFiles.length, "files");
    await ensureFFmpegLoaded();

    // Write files to memory
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const fileName = `input_${i}.mp3`;
      console.log(`Writing file ${fileName} to FFmpeg memory`);
      await ffmpeg.writeFile(fileName, await fetchFile(file));
    }

    // Create concat file
    const concatContent = audioFiles
      .map((_, i) => `file 'input_${i}.mp3'`)
      .join("\n");

    console.log("Creating concat list file");
    await ffmpeg.writeFile("concat_list.txt", concatContent);

    // Run concatenation command
    console.log("Running FFmpeg concatenation command");
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat_list.txt",
      "-c",
      "copy",
      "output_concat.mp3",
    ]);

    // Read the result
    console.log("Reading concatenated output");
    const outputData = await ffmpeg.readFile("output_concat.mp3");

    // Clean up files
    console.log("Cleaning up temporary files");
    try {
      await ffmpeg.deleteFile("output_concat.mp3");
      await ffmpeg.deleteFile("concat_list.txt");

      for (let i = 0; i < audioFiles.length; i++) {
        await ffmpeg.deleteFile(`input_${i}.mp3`);
      }
    } catch (cleanupError) {
      console.warn("Error during cleanup:", cleanupError);
      // Continue execution even if cleanup fails
    }

    console.log("Concatenation complete, output size:", outputData.length);
    return outputData;
  } catch (error) {
    console.error("Error concatenating audio files:", error);
    throw new Error(
      "Failed to concatenate audio files: " + (error.message || "Unknown error")
    );
  }
};

/**
 * Detects and trims silence from audio
 * @param {Uint8Array} inputData - Audio data to process
 * @param {Object} options - Silence detection options
 * @param {number} options.threshold - Silence threshold in dB (e.g., -50)
 * @param {number} options.duration - Minimum silence duration in seconds (e.g., 0.1)
 * @returns {Promise<Uint8Array>} - Processed audio as Uint8Array
 */
export const trimSilence = async (
  inputData,
  options = { threshold: -50, duration: 0.8 }
) => {
  try {
    console.log("Starting silence trimming with options:", options);
    await ensureFFmpegLoaded();

    // Write input file to memory
    console.log("Writing input file to FFmpeg memory");
    await ffmpeg.writeFile("input.mp3", inputData);

    // Run silence detection and trimming command
    console.log("Running FFmpeg silence detection command");
    await ffmpeg.exec([
      "-i",
      "input.mp3",
      "-af",
      `silenceremove=stop_periods=-1:stop_threshold=${options.threshold}dB:stop_duration=${options.duration}:window=0.02`,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      "output_trimmed.mp3",
    ]);

    // Read the result
    console.log("Reading trimmed output");
    const outputData = await ffmpeg.readFile("output_trimmed.mp3");

    // Clean up files
    console.log("Cleaning up temporary files");
    try {
      await ffmpeg.deleteFile("input.mp3");
      await ffmpeg.deleteFile("output_trimmed.mp3");
    } catch (cleanupError) {
      console.warn("Error during cleanup:", cleanupError);
      // Continue execution even if cleanup fails
    }

    console.log("Silence trimming complete, output size:", outputData.length);
    return outputData;
  } catch (error) {
    console.error("Error trimming silence:", error);
    throw new Error(
      "Failed to trim silence: " + (error.message || "Unknown error")
    );
  }
};

/**
 * Detects and trims silence from multiple audio files
 * @param {File[]} audioFiles - Array of audio files to process
 * @param {Object} options - Silence detection options
 * @returns {Promise<{audioData: Uint8Array, beforeDuration: number, afterDuration: number}>} - Processed audio with duration info
 */
export const processAudioFiles = async (audioFiles, options) => {
  try {
    console.log(
      `Processing ${audioFiles.length} audio files with options:`,
      options
    );

    // Calculate initial total duration (estimation)
    const beforeDuration = await getTotalAudioDuration(audioFiles);

    // First concatenate the files
    const concatenatedData = await concatenateAudioFiles(audioFiles);
    console.log("Concatenation complete. Size:", concatenatedData.length);

    // Then trim silence
    const trimmedData = await trimSilence(concatenatedData, options);
    console.log("Silence trimming complete. Size:", trimmedData.length);

    // Calculate after duration (estimation based on size reduction)
    const sizeRatio = Math.max(
      0.1,
      Math.min(1.0, trimmedData.length / concatenatedData.length)
    );
    const afterDuration = Math.max(1, beforeDuration * sizeRatio);

    console.log("Duration info:", {
      before: beforeDuration.toFixed(1),
      after: afterDuration.toFixed(1),
      saved: (beforeDuration - afterDuration).toFixed(1),
    });

    return {
      audioData: trimmedData,
      beforeDuration,
      afterDuration,
    };
  } catch (error) {
    console.error("Error in audio processing pipeline:", error);
    throw error;
  }
};

/**
 * Gets the duration of audio data in seconds
 * @param {Uint8Array} audioData - Audio data to analyze
 * @param {string} inputFormat - Input file format (default: 'mp3')
 * @returns {Promise<number>} - Duration in seconds
 */
export const getAudioDuration = async (audioData, inputFormat = "mp3") => {
  try {
    console.log("Getting audio duration...");
    await ensureFFmpegLoaded();

    const inputFileName = `temp_input.${inputFormat}`;

    // Write audio data to memory
    await ffmpeg.writeFile(inputFileName, audioData);

    // Get duration using ffprobe command
    await ffmpeg.exec(["-i", inputFileName, "-f", "null", "-"]);

    // Parse the duration from FFmpeg logs
    // Note: This is a simplified approach. In a real implementation,
    // you might want to capture the stderr output more precisely

    // Clean up
    try {
      await ffmpeg.deleteFile(inputFileName);
    } catch (cleanupError) {
      console.warn("Error during cleanup:", cleanupError);
    }

    // For now, return a placeholder - we'll implement proper duration parsing
    // In a real scenario, you'd parse the FFmpeg output to get actual duration
    return 0;
  } catch (error) {
    console.error("Error getting audio duration:", error);
    return 0;
  }
};

/**
 * Gets the total duration of multiple audio files
 * @param {File[]} audioFiles - Array of audio files
 * @returns {Promise<number>} - Total duration in seconds
 */
export const getTotalAudioDuration = async (audioFiles) => {
  try {
    console.log("Calculating total duration for", audioFiles.length, "files");

    // For now, we'll estimate based on file size and average bitrate
    // This is an approximation since getting exact duration requires loading each file
    let totalDuration = 0;

    for (const file of audioFiles) {
      // Rough estimation: assuming average MP3 bitrate of 128kbps
      // Duration ≈ (file size in bytes × 8) / (bitrate in bits per second)
      const estimatedDuration = (file.size * 8) / (128 * 1000); // seconds

      // Add some validation to prevent invalid values
      if (estimatedDuration > 0 && estimatedDuration < 3600) {
        // Between 0 and 1 hour
        totalDuration += estimatedDuration;
      } else {
        // Fallback estimation for very small or large files
        const fallbackDuration = Math.max(10, (file.size / (1024 * 1024)) * 60); // 1MB ≈ 1 minute
        totalDuration += fallbackDuration;
      }
    }

    // Ensure we have a reasonable duration
    const finalDuration = Math.max(1, Math.min(totalDuration, 3600)); // Between 1 second and 1 hour

    console.log(
      "Estimated total duration:",
      finalDuration.toFixed(1),
      "seconds"
    );
    return finalDuration;
  } catch (error) {
    console.error("Error calculating total duration:", error);
    return 60; // Default to 1 minute if calculation fails
  }
};

/**
 * Test function to verify FFmpeg is working
 * @returns {Promise<boolean>} - True if FFmpeg is working
 */
export const testFFmpeg = async () => {
  try {
    console.log("Testing audio processor...");
    await ensureFFmpegLoaded();

    // Try a simple FFmpeg command
    await ffmpeg.exec(["-version"]);
    console.log("Audio processor test successful!");
    return true;
  } catch (error) {
    console.error("Audio processor test failed:", error);
    return false;
  }
};

export default {
  ensureFFmpegLoaded,
  concatenateAudioFiles,
  trimSilence,
  processAudioFiles,
  getAudioDuration,
  getTotalAudioDuration,
  testFFmpeg,
};
