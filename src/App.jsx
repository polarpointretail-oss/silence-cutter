import { useState, useCallback, useEffect } from "react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import FileUploader from "./components/features/FileUploader";
import Settings from "./components/features/Settings";
import ProcessingStatus from "./components/features/ProcessingStatus";
import DownloadButton from "./components/features/DownloadButton";
import { useAudioProcessor } from "./hooks/useAudioProcessor";

function App() {
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState({ threshold: -50, duration: 0.8 });
  const [browserSupported, setBrowserSupported] = useState(true);

  const {
    isProcessing,
    progress,
    error,
    processingStats,
    hasProcessedAudio,
    processFiles,
    getDownloadUrl,
    reset,
  } = useAudioProcessor();

  // Check browser compatibility
  useEffect(() => {
    const checkBrowserSupport = () => {
      // Check for WebAssembly support
      if (typeof WebAssembly === "undefined") {
        setBrowserSupported(false);
        return;
      }

      // Check for SharedArrayBuffer support (needed for FFmpeg.wasm)
      try {
        // eslint-disable-next-line no-new
        new SharedArrayBuffer(1);
      } catch (e) {
        console.warn("SharedArrayBuffer not supported", e);
        setBrowserSupported(false);
        return;
      }

      setBrowserSupported(true);
    };

    checkBrowserSupport();
  }, []);

  const handleFilesSelected = useCallback(
    (selectedFiles) => {
      setFiles(selectedFiles);
      reset();
    },
    [reset]
  );

  const handleSettingsChange = useCallback(
    (newSettings) => {
      setSettings(newSettings);
      reset();
    },
    [reset]
  );

  const handleProcessClick = useCallback(() => {
    if (files.length > 0) {
      processFiles(files, settings);
    }
  }, [files, settings, processFiles]);

  const handleProcessAgain = useCallback(() => {
    reset();
    setFiles([]); // Clear the files array when going back to process another audio
  }, [reset]);

  if (!browserSupported) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12 pt-6">
          <Header />

          <main className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-card">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Browser Not Supported
              </h3>
              <p className="text-surface-700">
                This application requires a modern browser with WebAssembly and
                SharedArrayBuffer support.
              </p>
              <p className="mt-4 text-surface-700">
                Please try using the latest version of Chrome, Edge, or Firefox.
              </p>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <main className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Show upload and settings only when not processed or when processing */}
            {(!hasProcessedAudio || isProcessing) && (
              <>
                {/* Upload Area */}
                <div className="bg-white rounded-xl">
                  <FileUploader onFilesSelected={handleFilesSelected} />
                </div>

                {/* Settings Area */}
                <div className="bg-white rounded-xl shadow-sm">
                  <Settings
                    onChange={handleSettingsChange}
                    disabled={isProcessing}
                  />
                </div>

                {/* Process Button */}
                {files.length > 0 && !isProcessing && !hasProcessedAudio && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleProcessClick}
                      className="px-6 sm:px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-medium text-base sm:text-lg rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                      disabled={isProcessing}
                    >
                      Process Audio Files
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Error Message (custom styling) */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-red-600 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Error
                </h3>
                <p className="text-surface-700">{error}</p>
              </div>
            )}

            {/* Processing Status */}
            <ProcessingStatus
              isProcessing={isProcessing}
              progress={progress}
              error={null} /* Pass null to avoid default error display */
              processingStats={processingStats}
            />

            {/* Download Button */}
            <DownloadButton
              downloadUrl={hasProcessedAudio ? getDownloadUrl() : null}
            />

            {/* Process Again Button - shown only when audio has been processed */}
            {hasProcessedAudio && !isProcessing && (
              <div className="flex justify-center">
                <button
                  onClick={handleProcessAgain}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium text-lg rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Process Another Audio
                </button>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
