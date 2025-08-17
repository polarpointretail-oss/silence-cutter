# Audio Cleaner

A desktop application that automatically removes silence from the beginning and end of MP3 files, making your audio files ready for production.

## Features

- 🎵 **Silence Detection**: Automatically detects and removes leading and trailing silence
- 📁 **Batch Processing**: Process multiple MP3 files at once
- 🎚️ **Configurable Threshold**: Adjustable silence detection sensitivity (-30dB default)
- 🔄 **Concatenation**: Combines multiple files into a single cleaned output
- 🎯 **High Quality**: Uses FFmpeg for professional-grade audio processing
- 💻 **Cross-Platform**: Works on Windows, macOS, and Linux

## Screenshots

![Audio Cleaner Interface](https://via.placeholder.com/640x440/4A90E2/FFFFFF?text=Audio+Cleaner+Interface)

## Installation

### Download Pre-built Binaries

Download the latest release for your platform:
- [Windows (.exe)](https://github.com/yourusername/audio-cleaner/releases)
- [macOS (.dmg)](https://github.com/yourusername/audio-cleaner/releases)
- [Linux (.AppImage)](https://github.com/yourusername/audio-cleaner/releases)

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/audio-cleaner.git
   cd audio-cleaner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

4. **Build for distribution**
   ```bash
   # Build for all platforms
   npm run build
   
   # Build for specific platform
   npm run build:mac
   npm run build:win
   ```

## Usage

1. **Launch the application**
2. **Click "Select MP3 & Clean"**
3. **Choose one or more MP3 files** (files will be processed in chronological order)
4. **Wait for processing** - the app will:
   - Concatenate all selected files
   - Detect silence at the beginning and end
   - Remove the silence
   - Save the cleaned audio as a WAV file
5. **Find your cleaned audio** in the `output` folder next to your original files

## How It Works

The application uses FFmpeg's `silencedetect` filter to identify periods of silence:

1. **Silence Detection**: Analyzes audio for periods below the threshold (-30dB by default)
2. **Boundary Detection**: Finds the first non-silent moment and last non-silent moment
3. **Trimming**: Removes all audio outside these boundaries
4. **Output**: Saves as high-quality WAV file

## Configuration

### Silence Threshold

The default silence threshold is -30dB. You can modify this in the source code:

```javascript
// In main.js, line ~50
function detectSilence(filePath, thresholdDb = -30) {
```

Lower values (e.g., -40dB) are more sensitive to quiet sounds.
Higher values (e.g., -20dB) only detect very loud silence.

## Technical Details

- **Framework**: Electron
- **Audio Processing**: FFmpeg (bundled)
- **Language**: JavaScript/Node.js
- **UI**: HTML/CSS/JavaScript

## Development

### Project Structure

```
audio-cleaner/
├── main.js          # Main Electron process
├── preload.js       # Preload script for security
├── renderer/        # UI files
│   ├── index.html   # Main interface
│   └── renderer.js  # UI logic
└── package.json     # Dependencies and build config
```

### Building

The app uses `electron-builder` for creating distributable packages:

```bash
npm run build        # Build for current platform
npm run build:mac    # Build macOS .dmg
npm run build:win    # Build Windows .exe
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FFmpeg](https://ffmpeg.org/) for audio processing
- [Electron](https://electronjs.org/) for cross-platform desktop apps
- [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) for bundled FFmpeg

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/audio-cleaner/issues) page
2. Create a new issue with details about your problem
3. Include your operating system and app version

---

Made with ❤️ for audio enthusiasts 