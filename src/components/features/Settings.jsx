import { useState, useEffect } from "react";

const Settings = ({ onChange, disabled = false }) => {
  const [threshold, setThreshold] = useState(-50);
  const [duration, setDuration] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onChange({ threshold, duration });
  }, [threshold, duration, onChange]);

  return (
    <div className="rounded-xl p-4 sm:p-6 lg:p-8">
      <div
        className="flex justify-between items-center cursor-pointer mb-6"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg sm:text-xl font-semibold flex items-center text-surface-800">
          <svg
            className="w-5 h-5 mr-2 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          Settings
        </h2>
        <button className="text-surface-400 hover:text-surface-600 transition-colors">
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2 sm:gap-0">
              <label className="text-surface-700 font-medium text-sm sm:text-base">
                Silence Threshold:
              </label>
              <span className="px-3 py-1 bg-primary-50 rounded-full text-primary-700 text-sm font-medium shadow-sm self-start sm:self-auto">
                {threshold} dB
              </span>
            </div>
            <div className="relative mb-2">
              <div className="relative mb-4">
                <input
                  type="range"
                  min="-60"
                  max="-10"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  disabled={disabled}
                />
              </div>
              <div className="flex justify-between text-xs text-surface-500 font-medium">
                <span>-60 dB</span>
                <span>-10 dB</span>
              </div>
            </div>
            <p className="text-sm text-surface-500 mt-3">
              Lower values detect quieter sounds as silence
            </p>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2 sm:gap-0">
              <label className="text-surface-700 font-medium text-sm sm:text-base">
                Minimum Silence Duration:
              </label>
              <span className="px-3 py-1 bg-primary-50 rounded-full text-primary-700 text-sm font-medium shadow-sm self-start sm:self-auto">
                {duration} sec
              </span>
            </div>
            <div className="relative mb-2">
              <div className="relative mb-4">
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  disabled={disabled}
                />
              </div>
              <div className="flex justify-between text-xs text-surface-500 font-medium">
                <span>0.01 sec</span>
                <span>2.00 sec</span>
              </div>
            </div>
            <p className="text-sm text-surface-500 mt-3">
              Minimum duration of silence to be detected
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
