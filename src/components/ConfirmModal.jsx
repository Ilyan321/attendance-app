import React from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Delete', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div 
        className="bg-white w-full max-w-md p-8 flex flex-col gap-6 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-red-600">
          <span className="material-symbols-outlined text-[32px]">warning</span>
          <h2 className="font-headline-sm text-headline-sm font-bold">{title}</h2>
        </div>
        
        <p className="font-body-md text-on-surface-variant text-base">
          {message}
        </p>

        <div className="flex justify-end items-center gap-4 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant font-label-lg hover:text-on-surface transition-colors cursor-pointer px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-label-lg hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-red-600/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
