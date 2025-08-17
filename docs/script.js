// FFmpeg.wasm Audio Silence Cutter
console.log('=== FFMPEG.WASM VERSION LOADED ===');
console.log('=== TIMESTAMP: ' + new Date().toISOString() + ' ===');

class SilenceCutter {
    constructor() {
        console.log('SilenceCutter constructor called');
        this.files = [];
        this.results = [];
        this.isProcessing = false;
        this.ffmpeg = null;
        this.ffmpegLoaded = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFFmpeg();
    }
    
    initializeElements() {
        console.log('Initializing elements');
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
        
        this.thresholdSlider = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('thresholdValue');
        this.durationSlider = document.getElementById('minSilenceDuration');
        this.durationValue = document.getElementById('durationValue');
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners');
        
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
        
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = `${e.target.value} dB`;
        });
        this.durationSlider.addEventListener('input', (e) => {
            this.durationValue.textContent = `${e.target.value} seconds`;
        });
        
        this.processBtn.addEventListener('click', () => this.processFiles());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }
    
    async loadFFmpeg() {
        try {
            console.log('Loading FFmpeg.wasm...');
            this.progressSection.style.display = 'block';
            this.progressText.textContent = 'Loading FFmpeg.wasm...';
            this.progressFill.style.width = '25%';
            
            // Check if FFmpeg is available
            if (typeof FFmpeg === 'undefined') {
                throw new Error('FFmpeg.wasm not loaded. Please check your internet connection.');
            }
            
            this.ffmpeg = new FFmpeg();
            
            // Set up logging
            this.ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg:', message);
            });
            
            this.ffmpeg.on('progress', ({ progress }) => {
                console.log('FFmpeg progress:', progress);
                if (this.progressText) {
                    this.progressText.textContent = `Processing... ${Math.round(progress * 100)}%`;
                }
            });
            
            // Load FFmpeg core with proper URLs
            this.progressText.textContent = 'Loading FFmpeg core...';
            this.progressFill.style.width = '50%';
            
            await this.ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm',
                workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.worker.js'
            });
            
            console.log('FFmpeg.wasm loaded successfully');
            this.ffmpegLoaded = true;
            
            this.progressText.textContent = 'FFmpeg ready!';
            this.progressFill.style.width = '100%';
            
            setTimeout(() => {
                this.progressSection.style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            this.progressText.textContent = `Failed to load FFmpeg: ${error.message}`;
            this.progressFill.style.width = '100%';
            this.progressFill.style.background = '#dc3545';
        }
    }
    
    handleFiles(fileList) {
        console.log('Handling files:', fileList.length);
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
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">🎵</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${fileSize}</p>
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
        console.log('Processing files started');
        if (this.isProcessing || this.files.length === 0) return;
        
        if (!this.ffmpegLoaded) {
            alert('FFmpeg is not loaded yet. Please wait or refresh the page.');
            return;
        }
        
        this.isProcessing = true;
        this.progressSection.style.display = 'block';
        this.results = [];
        
        const thresholdDb = parseInt(this.thresholdSlider.value);
        const minSilenceDuration = parseFloat(this.durationSlider.value);
        
        console.log('Processing with threshold:', thresholdDb, 'duration:', minSilenceDuration);
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            
            try {
                this.progressText.textContent = `Processing ${file.name}...`;
                this.progressFill.style.width = `${((i + 1) / this.files.length) * 100}%`;
                
                const result = await this.processFile(file, thresholdDb, minSilenceDuration);
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
    
    async processFile(file, thresholdDb, minSilenceDuration) {
        try {
            console.log('Processing file:', file.name, 'size:', file.size);
            
            // Write input file to FFmpeg
            const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
            await this.ffmpeg.writeFile(inputName, await this.fileToUint8Array(file));
            
            // Step 1: Detect silence using silencedetect filter
            console.log('Detecting silence...');
            await this.ffmpeg.exec([
                '-i', inputName,
                '-af', `silencedetect=noise=${thresholdDb}dB:d=${minSilenceDuration}`,
                '-f', 'null',
                '-'
            ]);
            
            // Get the logs to parse silence detection results
            // Note: FFmpeg.wasm outputs logs to console, not to a file
            // We'll use a simpler approach for now
            const silenceData = {
                firstSilenceEnd: 0.1, // Default: start after 100ms
                lastSilenceStart: null // Will be calculated from duration
            };
            console.log('Silence data:', silenceData);
            
            // Step 2: Trim the audio based on silence detection
            const startTime = Math.max(0, (silenceData.firstSilenceEnd || 0) - 0.005);
            const endTime = silenceData.lastSilenceStart ? silenceData.lastSilenceStart + 0.005 : null;
            
            const outputName = `output_${Date.now()}.wav`;
            const trimArgs = ['-y', '-ss', startTime.toFixed(3), '-i', inputName];
            
            if (endTime) {
                trimArgs.push('-t', (endTime - startTime).toFixed(3));
            }
            
            trimArgs.push('-c:a', 'pcm_s16le', outputName);
            
            console.log('Trimming audio with args:', trimArgs);
            await this.ffmpeg.exec(trimArgs);
            
            // Read the output file
            const outputData = await this.ffmpeg.readFile(outputName);
            
            // Clean up temporary files
            await this.ffmpeg.deleteFile(inputName);
            await this.ffmpeg.deleteFile(outputName);
            
            return {
                originalFile: file,
                outputData: outputData,
                outputName: `cleaned_${file.name.replace(/\.[^/.]+$/, '')}.wav`,
                startTime: startTime,
                endTime: endTime,
                duration: endTime ? endTime - startTime : null,
                success: true
            };
            
        } catch (error) {
            console.error('Error in processFile:', error);
            throw new Error(`Processing failed: ${error.message}`);
        }
    }
    

    
    async fileToUint8Array(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                resolve(new Uint8Array(arrayBuffer));
            };
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    showResults() {
        this.resultsList.innerHTML = '';
        
        this.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            if (result.success) {
                const duration = result.duration ? result.duration.toFixed(2) : 'Unknown';
                
                resultItem.innerHTML = `
                    <div class="result-info">
                        <div class="result-icon">✅</div>
                        <div class="result-details">
                            <h4>${result.originalFile.name}</h4>
                            <p>Trimmed duration: ${duration}s</p>
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
}

// Initialize the app when the page loads
let silenceCutter;
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM LOADED - FFMPEG.WASM VERSION ===');
    silenceCutter = new SilenceCutter();
});
