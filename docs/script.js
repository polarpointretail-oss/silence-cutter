// ES Module approach for FFmpeg.wasm
console.log('Script loading...');

class SilenceCutter {
    constructor() {
        console.log('SilenceCutter constructor called');
        this.ffmpeg = null;
        this.ffmpegLoaded = false;
        this.selectedFiles = [];
        this.results = [];
        
        // Set up event listeners immediately
        this.setupEventListeners();
        
        // Try to load FFmpeg in the background
        this.init();
    }

    async init() {
        try {
            await this.loadFFmpeg();
        } catch (error) {
            console.error('FFmpeg initialization failed:', error);
            // Don't show error to user yet - let them try to use the interface
        }
    }

    async loadFFmpeg() {
        console.log('Loading FFmpeg.wasm...');
        
        try {
            // Try multiple approaches to load FFmpeg
            let createFFmpeg, fetchFile;
            
            // Approach 1: Try ES module import
            try {
                const module = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/ffmpeg.js');
                createFFmpeg = module.createFFmpeg;
                fetchFile = module.fetchFile;
                console.log('FFmpeg loaded via ES module');
            } catch (esmError) {
                console.log('ES module failed, trying UMD approach...');
                console.log('ES module error:', esmError);
                
                // Approach 2: Try UMD approach
                console.log('Checking for FFmpeg global:', typeof window.FFmpeg);
                console.log('Window FFmpeg object:', window.FFmpeg);
                
                if (typeof window.FFmpeg !== 'undefined') {
                    createFFmpeg = window.FFmpeg.createFFmpeg;
                    fetchFile = window.FFmpeg.fetchFile;
                    console.log('FFmpeg loaded via UMD');
                } else {
                    // Try alternative UMD structure
                    console.log('Checking for createFFmpeg global:', typeof window.createFFmpeg);
                    if (typeof window.createFFmpeg !== 'undefined') {
                        createFFmpeg = window.createFFmpeg;
                        fetchFile = window.fetchFile;
                        console.log('FFmpeg loaded via global createFFmpeg');
                    } else {
                        throw new Error('FFmpeg not available in any format');
                    }
                }
            }
            
            console.log('createFFmpeg function:', typeof createFFmpeg);
            console.log('fetchFile function:', typeof fetchFile);
            
            this.ffmpeg = createFFmpeg({ 
                log: true,
                coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm'
            });
            
            await this.ffmpeg.load();
            
            this.ffmpegLoaded = true;
            console.log('FFmpeg loaded successfully');
            
        } catch (error) {
            console.error('FFmpeg loading failed:', error);
            throw new Error('FFmpeg.wasm not loaded. Please check your internet connection.');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const processBtn = document.getElementById('processBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');

        console.log('Elements found:', {
            uploadArea: !!uploadArea,
            fileInput: !!fileInput,
            processBtn: !!processBtn,
            downloadAllBtn: !!downloadAllBtn
        });

        if (!uploadArea || !fileInput) {
            console.error('Required elements not found!');
            return;
        }

        // File upload handling
        uploadArea.addEventListener('click', (e) => {
            console.log('Upload area clicked');
            e.preventDefault();
            fileInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            console.log('Drag over detected');
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            console.log('Drag leave detected');
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            console.log('Drop detected, files:', e.dataTransfer.files.length);
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed, files:', e.target.files.length);
            this.handleFiles(e.target.files);
        });

        // Settings controls
        const threshold = document.getElementById('threshold');
        const thresholdValue = document.getElementById('thresholdValue');
        const minSilenceDuration = document.getElementById('minSilenceDuration');
        const durationValue = document.getElementById('durationValue');

        if (threshold && thresholdValue) {
            threshold.addEventListener('input', (e) => {
                thresholdValue.textContent = `${e.target.value} dB`;
            });
        }
        
        if (minSilenceDuration && durationValue) {
            minSilenceDuration.addEventListener('input', (e) => {
                durationValue.textContent = `${e.target.value} seconds`;
            });
        }

        // Process button
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                console.log('Process button clicked');
                this.processFiles();
            });
        }

        // Download all button
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                console.log('Download all button clicked');
                this.downloadAllResults();
            });
        }
        
        console.log('Event listeners setup complete');
    }

    handleFiles(files) {
        console.log('handleFiles called with:', files.length, 'files');
        if (files.length === 0) {
            console.log('No files provided');
            return;
        }

        const filesList = document.getElementById('filesList');
        const filesSection = document.getElementById('filesSection');
        
        console.log('Files elements found:', {
            filesList: !!filesList,
            filesSection: !!filesSection
        });
        
        if (!filesList || !filesSection) {
            console.error('Files display elements not found!');
            return;
        }
        
        filesList.innerHTML = '';
        this.selectedFiles = Array.from(files);
        
        console.log('Processing files:', this.selectedFiles.map(f => f.name));
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            filesList.appendChild(fileItem);
        });
        
        filesSection.style.display = 'block';
        console.log('Files section displayed');
    }

    async processFiles() {
        if (!this.ffmpegLoaded) {
            this.showError('FFmpeg not loaded yet. Please wait a moment and try again.');
            return;
        }

        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.showError('Please select files to process.');
            return;
        }

        this.showProgress();
        this.results = [];

        try {
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                const progress = ((i + 1) / this.selectedFiles.length) * 100;
                
                this.updateProgress(`Processing ${file.name}...`, progress);
                const result = await this.processFile(file);
                this.results.push(result);
            }

            this.showResults();
        } catch (error) {
            console.error('Processing failed:', error);
            this.showError(`Processing failed: ${error.message}`);
        }
    }

    async processFile(file) {
        const threshold = document.getElementById('threshold').value;
        const minSilenceDuration = document.getElementById('minSilenceDuration').value;
        
        try {
            // Write file to FFmpeg's virtual filesystem
            const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
            const outputName = `output_${Date.now()}.wav`;
            
            this.ffmpeg.FS('writeFile', inputName, await this.fileToUint8Array(file));
            
            // Run silence detection
            await this.ffmpeg.run(
                '-i', inputName,
                '-af', `silencedetect=noise=${threshold}dB:d=${minSilenceDuration}`,
                '-f', 'null',
                '-'
            );
            
            // Get silence detection logs
            const logs = this.ffmpeg.FS('readFile', '/dev/stdout');
            const silenceLogs = this.parseSilenceLogs(logs.toString());
            
            // Process the file to remove silence
            await this.ffmpeg.run(
                '-i', inputName,
                '-af', `silenceremove=stop_periods=-1:stop_duration=${minSilenceDuration}:stop_threshold=${threshold}dB`,
                outputName
            );
            
            // Read the processed file
            const outputData = this.ffmpeg.FS('readFile', outputName);
            
            // Clean up
            this.ffmpeg.FS('unlink', inputName);
            this.ffmpeg.FS('unlink', outputName);
            
            return {
                originalName: file.name,
                processedData: outputData,
                silenceLogs: silenceLogs
            };
            
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            throw new Error(`Failed to process ${file.name}: ${error.message}`);
        }
    }

    parseSilenceLogs(logs) {
        // Simple parsing - in a real implementation, you'd parse the actual FFmpeg output
        return {
            silenceDetected: logs.includes('silence_start') || logs.includes('silence_end'),
            duration: 'Unknown'
        };
    }

    async fileToUint8Array(file) {
        return new Uint8Array(await file.arrayBuffer());
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('filesSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
    }

    updateProgress(text, percentage) {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        if (progressText) progressText.textContent = text;
        if (progressFill) progressFill.style.width = `${percentage}%`;
    }

    showResults() {
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';
        
        this.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const blob = new Blob([result.processedData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            resultItem.innerHTML = `
                <div class="result-info">
                    <span class="file-name">${result.originalName}</span>
                    <span class="file-size">${this.formatFileSize(result.processedData.length)}</span>
                </div>
                <div class="result-actions">
                    <a href="${url}" download="${result.originalName.replace(/\.[^/.]+$/, '')}_processed.wav" class="btn btn-small">Download</a>
                </div>
            `;
            
            resultsList.appendChild(resultItem);
        });
    }

    showError(message) {
        this.updateProgress(message, 100);
        const progressFill = document.getElementById('progressFill');
        if (progressFill) progressFill.style.backgroundColor = '#e74c3c';
    }

    downloadAllResults() {
        this.results.forEach((result, index) => {
            const blob = new Blob([result.processedData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${result.originalName.replace(/\.[^/.]+$/, '')}_processed.wav`;
            a.click();
            URL.revokeObjectURL(url);
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

// Initialize when DOM is loaded
console.log('DOM loaded, initializing SilenceCutter...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    new SilenceCutter();
});

console.log('Script loaded successfully');
