import React, { useState } from 'react';

export default function DownloadModal({ isOpen, title, onDownload, onCancel }) {
  const [fileType, setFileType] = useState('csv');

  if (!isOpen) return null;

  const handleDownload = () => {
    onDownload(fileType);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div 
        className="bg-white w-full max-w-md p-8 flex flex-col gap-6 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined text-[32px]">file_download</span>
          <h2 className="font-headline-sm text-headline-sm font-bold">{title}</h2>
        </div>
        
        <p className="font-body-md text-on-surface-variant text-base">
          Choose a file format to export your attendance data.
        </p>

        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            File Type
          </label>
          <select
            className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface cursor-pointer"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <option value="csv">CSV (Spreadsheet)</option>
            {/* Future formats can be added here */}
          </select>
        </div>

        <div className="flex justify-end items-center gap-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant font-label-lg hover:text-on-surface transition-colors cursor-pointer px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-lg hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
