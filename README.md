# FFmpeg Web - Audio Silence Removal Tool

A modern web application that allows users to upload multiple audio files, reorder them, and automatically remove silence using FFmpeg.wasm. Built with React, Vite, and Tailwind CSS.

## ✨ Features

- **Multi-file Upload**: Upload up to 8 audio files (MP3, WAV, etc.)
- **Drag & Drop Reordering**: Intuitive drag-and-drop interface to reorder audio files before processing
- **Silence Removal**: Automatically detect and remove silence using configurable thresholds
- **Real-time Processing**: Live progress tracking with visual feedback
- **Duration Comparison**: See before/after duration statistics
- **File Size Optimization**: Reduce file sizes by removing unnecessary silence
- **Browser-based**: No server required - everything runs in your browser
- **Modern UI**: Clean, responsive design with smooth animations

## 🚀 Live Demo

[Deploy your own instance](#deployment) or try the live demo (if available).

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Audio Processing**: FFmpeg.wasm
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- Modern browser with WebAssembly support

## 🏗️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ffmpeg-web.git
cd ffmpeg-web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

## 🎯 Usage

1. **Upload Audio Files**: Click the upload area or drag files to upload up to 8 audio files
2. **Reorder Files**: Drag and drop files to reorder them in your desired sequence
3. **Configure Settings**: Adjust silence detection threshold and minimum duration
4. **Process Audio**: Click "Process Audio Files" to start processing
5. **Download Result**: Once complete, download the processed audio file

### Settings Explained

- **Silence Threshold**: Audio level below which is considered silence (default: -50dB)
- **Minimum Duration**: Minimum silence duration to remove (default: 0.8 seconds)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

#### Option 1: Web Interface

1. **Fork/Clone the repository** to your GitHub account

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your repository

3. **Configure build settings**:

   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables** (if needed):

   - No environment variables required for basic functionality

5. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

#### Option 2: Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:

   ```bash
   cd ffmpeg-web
   vercel
   ```

4. **Follow the CLI prompts**:

   - Link to existing project or create new one
   - Confirm build settings (should auto-detect Vite)
   - Deploy

5. **For production deployment**:

   ```bash
   vercel --prod
   ```

6. **Set up automatic deployments**:
   ```bash
   vercel --prod --yes
   ```

### Manual Deployment

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your preferred hosting service

### Alternative Deployment Options

- **Netlify**: Similar to Vercel, supports Vite builds out of the box
- **GitHub Pages**: Requires additional configuration for SPA routing
- **AWS S3 + CloudFront**: Static hosting with CDN
- **Firebase Hosting**: Google's hosting solution

## 🔧 Configuration

### Customizing FFmpeg Settings

Edit `src/services/ffmpeg/ffmpegService.js` to modify:

- Audio processing parameters
- File format support
- Processing algorithms

### Styling Customization

The app uses Tailwind CSS. Customize styles in:

- `tailwind.config.js` - Theme configuration
- `src/index.css` - Global styles
- Component files - Component-specific styles

## 📁 Project Structure

```
ffmpeg-web/
├── public/
│   ├── ffmpeg-core-mt/     # FFmpeg.wasm files
│   └── workers/            # Web worker files
├── src/
│   ├── components/
│   │   ├── features/       # Main feature components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # FFmpeg service
│   └── utils/              # Utility functions
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🐛 Troubleshooting

### Common Issues

1. **"SharedArrayBuffer is not supported"**

   - Solution: Use HTTPS in production (required for SharedArrayBuffer)
   - Local development should work with HTTP

2. **"WebAssembly is not supported"**

   - Solution: Update to a modern browser that supports WebAssembly

3. **Large files not processing**

   - Solution: Check file size limits (20MB total)
   - Reduce file count (max 8 files)

4. **Processing fails**
   - Solution: Check browser console for detailed error messages
   - Ensure files are valid audio formats

### Browser Compatibility

- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 11.1+
- ✅ Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - Browser-based FFmpeg
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](https://github.com/yourusername/ffmpeg-web/issues)
3. Create a new issue with detailed information

---

**Note**: This application processes audio entirely in your browser. No audio data is sent to any server, ensuring your privacy and security.
