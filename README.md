# Silence Cutter - Web Audio Cleaner

A web application that automatically removes silence from the beginning and end of audio files, making your audio files ready for production. **No downloads required - works entirely in your browser!**

## 🌐 Live Demo

**Try it now:** [https://polarpointretail-oss.github.io/silence-cutter/](https://polarpointretail-oss.github.io/silence-cutter/)

## Features

- 🎵 **Smart Silence Detection**: Automatically detects and removes leading and trailing silence
- 📁 **Batch Processing**: Process multiple audio files at once
- 🎚️ **Configurable Threshold**: Adjustable silence detection sensitivity (-50dB to -10dB)
- ⏱️ **Duration Control**: Set minimum silence duration (0.1 to 2.0 seconds)
- 🔒 **Privacy First**: All processing happens in your browser - no data leaves your device
- 💻 **No Installation**: Works on any modern browser, no downloads required
- 🎯 **High Quality**: Uses FFmpeg.wasm for professional-grade audio processing
- 📱 **Mobile Friendly**: Responsive design works on desktop, tablet, and mobile

## How to Use

1. **Visit the website**: Go to [https://polarpointretail-oss.github.io/silence-cutter/](https://polarpointretail-oss.github.io/silence-cutter/)
2. **Upload files**: Drag and drop audio files or click to browse
3. **Adjust settings**: Configure silence threshold and minimum duration
4. **Process**: Click "Process Audio Files" and wait for completion
5. **Download**: Download your cleaned audio files

## Supported Formats

- **Input**: MP3, WAV, M4A, OGG, FLAC
- **Output**: WAV (high quality)

## How It Works

The web application uses:

1. **Web Audio API**: For file handling and audio processing
2. **FFmpeg.wasm**: WebAssembly version of FFmpeg for professional audio analysis
3. **Silence Detection**: Uses FFmpeg's `silencedetect` filter to find silence boundaries
4. **Audio Trimming**: Removes audio outside the detected boundaries
5. **Client-side Processing**: Everything happens in your browser for privacy

## Technical Details

- **Framework**: Vanilla JavaScript with Web Audio API
- **Audio Processing**: FFmpeg.wasm (WebAssembly)
- **UI**: HTML5, CSS3, JavaScript
- **Deployment**: GitHub Pages

## Development

### Project Structure

```
silence-cutter/
├── docs/                 # GitHub Pages website
│   ├── index.html       # Main web application
│   ├── styles.css       # Application styles
│   └── script.js        # Application logic
├── main.js              # Electron main process (desktop app)
├── renderer/            # Electron renderer (desktop app)
└── package.json         # Dependencies and build config
```

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/polarpointretail-oss/silence-cutter.git
   cd silence-cutter
   ```

2. **Serve the web app locally**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve docs
   
   # Using PHP
   php -S localhost:8000 -t docs
   ```

3. **Open in browser**: http://localhost:8000

### Desktop App Development

The repository also includes the original Electron desktop application:

```bash
npm install
npm start
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Privacy & Security

- **No server processing**: All audio processing happens in your browser
- **No data upload**: Your files never leave your device
- **No tracking**: No analytics or user tracking
- **Open source**: Transparent code you can audit

## Use Cases

- **🎙️ Podcasters**: Remove dead air from podcast episodes
- **🎵 Musicians**: Clean up recordings by removing unwanted silence
- **🎬 Content Creators**: Prepare audio for video editing
- **📚 Educators**: Clean up lecture recordings
- **🎧 Audio Engineers**: Quick silence removal for production

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
- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) for WebAssembly port
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for browser audio handling

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/polarpointretail-oss/silence-cutter/issues) page
2. Create a new issue with details about your problem
3. Include your browser version and operating system

---

Made with ❤️ for audio enthusiasts
