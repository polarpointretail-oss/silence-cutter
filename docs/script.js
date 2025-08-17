// PURE WEB AUDIO API SOLUTION - NO FFMPEG AT ALL
console.log('=== PURE WEB AUDIO API VERSION ===');

class SilenceCutter {
    constructor() {
        console.log('SilenceCutter constructor called');
        this.files = [];
        this.results = [];
        this.isProcessing = false;
        this.audioContext = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioContext();
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
    
    async initializeAudioContext() {
        try {
            console.log('Initializing audio context');
            this.progressSection.style.display = 'block';
            this.progressText.textContent = 'Initializing audio processing...';
            this.progressFill.style.width = '50%';
            
            // Create audio context with proper error handling
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if suspended (required for user interaction)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log('Audio context created:', this.audioContext.state);
            
            this.progressText.textContent = 'Audio processing ready!';
            this.progressFill.style.width = '100%';
            
            setTimeout(() => {
                this.progressSection.style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            this.progressText.textContent = 'Failed to initialize audio processing. Please refresh the page.';
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
        console.log('Processing files started');
        if (this.isProcessing || this.files.length === 0) return;
        
        if (!this.audioContext) {
            alert('Audio processing is not initialized. Please wait or refresh the page.');
            return;
        }
        
        // Ensure audio context is resumed
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.isProcessing = true;
        this.progressSection.style.display = 'block';
        this.results = [];
        
        const threshold = parseInt(this.thresholdSlider.value);
        const minDuration = parseFloat(this.durationSlider.value);
        
        console.log('Processing with threshold:', threshold, 'duration:', minDuration);
        
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
        try {
            console.log('Processing file:', file.name, 'size:', file.size);
            
            // Convert threshold from dB to linear scale
            const thresholdLinear = Math.pow(10, threshold / 20);
            console.log('Threshold linear:', thresholdLinear);
            
            // Read file using FileReader for better compatibility
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log('Array buffer size:', arrayBuffer.byteLength);
            
            // Decode audio data with proper error handling
            const audioBuffer = await this.decodeAudioData(arrayBuffer);
            console.log('Audio buffer decoded:', {
                sampleRate: audioBuffer.sampleRate,
                duration: audioBuffer.duration,
                channels: audioBuffer.numberOfChannels,
                length: audioBuffer.length
            });
            
            // Get audio data
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            
            // Improved silence detection with better algorithm
            const silenceData = this.detectSilenceImproved(channelData, sampleRate, thresholdLinear, minDuration);
            
            console.log('Silence detection:', silenceData);
            
            // Create trimmed buffer
            const startSample = Math.max(0, Math.floor(silenceData.startTime * sampleRate));
            const endSample = Math.min(channelData.length, Math.floor(silenceData.endTime * sampleRate));
            const trimmedLength = endSample - startSample;
            
            console.log('Trim points:', {
                startSample,
                endSample,
                trimmedLength,
                startTime: startSample / sampleRate,
                endTime: endSample / sampleRate
            });
            
            const trimmedBuffer = this.audioContext.createBuffer(1, trimmedLength, sampleRate);
            const trimmedData = trimmedBuffer.getChannelData(0);
            
            for (let i = 0; i < trimmedLength; i++) {
                trimmedData[i] = channelData[startSample + i];
            }
            
            // Convert to WAV
            const wavData = this.audioBufferToWav(trimmedBuffer);
            console.log('WAV data created, size:', wavData.length);
            
            return {
                originalFile: file,
                outputData: wavData,
                outputName: `cleaned_${file.name.replace(/\.[^/.]+$/, '')}.wav`,
                startTime: startSample / sampleRate,
                endTime: endSample / sampleRate,
                duration: trimmedLength / sampleRate,
                success: true
            };
            
        } catch (error) {
            console.error('Error in processFile:', error);
            throw new Error(`Processing failed: ${error.message}`);
        }
    }
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    decodeAudioData(arrayBuffer) {
        return new Promise((resolve, reject) => {
            this.audioContext.decodeAudioData(
                arrayBuffer,
                (buffer) => resolve(buffer),
                (error) => reject(new Error(`Audio decode failed: ${error}`))
            );
        });
    }
    
    detectSilenceImproved(channelData, sampleRate, threshold, minDuration) {
        const minSamples = Math.floor(minDuration * sampleRate);
        let startTime = 0;
        let endTime = channelData.length / sampleRate;
        
        // Find first non-silent moment
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                startTime = i / sampleRate;
                break;
            }
        }
        
        // Find last non-silent moment
        for (let i = channelData.length - 1; i >= 0; i--) {
            if (Math.abs(channelData[i]) > threshold) {
                endTime = i / sampleRate;
                break;
            }
        }
        
        // Ensure minimum duration
        if (endTime - startTime < minDuration) {
            endTime = startTime + minDuration;
        }
        
        return {
            startTime: Math.max(0, startTime - 0.005), // 5ms padding
            endTime: Math.min(channelData.length / sampleRate, endTime + 0.005)
        };
    }
    
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const channels = buffer.numberOfChannels;
        
        const headerLength = 44;
        const dataLength = length * channels * 2;
        const totalLength = headerLength + dataLength;
        
        const arrayBuffer = new ArrayBuffer(totalLength);
        const view = new DataView(arrayBuffer);
        
        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, totalLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * 2, true);
        view.setUint16(32, channels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write audio data
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Uint8Array(arrayBuffer);
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
    console.log('=== DOM LOADED - PURE WEB AUDIO API VERSION ===');
    silenceCutter = new SilenceCutter();
});
