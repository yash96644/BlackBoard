import React, { useState, useEffect } from 'react';

const WindowsIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 88 88"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203-.033-29.766zm35.67 33.529l.016 34.456-35.67-4.814v-29.84l35.654.198zM87.33 0l.004 41.523-46.685.195-.016-35.91L87.33 0zM40.633 46.101l46.697.23V88l-46.697-6.52v-35.38z" />
  </svg>
);

const DesktopDownloadPanel = React.memo(() => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Elegant entrance animation after initial load
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`absolute top-4 right-52 z-50 pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${mounted ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}
      `}
    >
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0f0f1a]/70 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_4_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.07)] hover:border-white/25 hover:bg-[#151525]/80 group">

        {/* Status & Title */}
        <div className="flex items-center gap-2.5 pl-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-gray-200 text-[13px] font-medium tracking-wide">
            Desktop App Available
          </span>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />

        {/* Minimal Download Button */}
        <a
          href="https://github.com/yash96644/BlackBoard/releases/download/v-1.0.0/Blackboard.Setup.1.0.0.exe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white text-[12px] font-semibold rounded-full transition-all duration-200 active:scale-95"
        >
          <WindowsIcon className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>

      </div>
    </div>
  );
});

export default DesktopDownloadPanel;
