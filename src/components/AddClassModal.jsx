import React, { useState, useEffect } from 'react';

export default function AddClassModal({ isOpen, onClose, onAddClass, onUpdateClass, editingClass }) {
  const [subjectName, setSubjectName] = useState('');
  const [rollNumbersText, setRollNumbersText] = useState('');
  const [error, setError] = useState('');

  // Pre-fill fields when opening in edit mode, clear them when opening fresh
  useEffect(() => {
    if (isOpen) {
      if (editingClass) {
        setSubjectName(editingClass.subjectName || '');
        setRollNumbersText(
          editingClass.student_roll_numbers ? editingClass.student_roll_numbers.join(', ') : ''
        );
      } else {
        setSubjectName('');
        setRollNumbersText('');
      }
      setError('');
    }
  }, [isOpen, editingClass]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!subjectName.trim()) {
      setError('Subject Name is required.');
      return;
    }

    if (!rollNumbersText.trim()) {
      setError('Please provide at least one student roll number.');
      return;
    }

    // Parse roll numbers: split by comma, trim whitespace, remove empty elements
    const student_roll_numbers = rollNumbersText
      .split(',')
      .map((roll) => roll.trim())
      .filter((roll) => roll.length > 0);

    if (student_roll_numbers.length === 0) {
      setError('Please enter valid, non-empty roll numbers separated by commas.');
      return;
    }

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        subjectName: subjectName.trim(),
        student_roll_numbers,
      });
    } else {
      onAddClass({
        subjectName: subjectName.trim(),
        student_roll_numbers,
      });
    }

    // Reset fields and close
    setSubjectName('');
    setRollNumbersText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div 
        className="bg-white w-full max-w-2xl p-12 flex flex-col gap-8 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            {editingClass ? 'Edit Class' : 'Create New Class'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span className="font-body-md">{error}</span>
          </div>
        )}

        {/* Form Container (Standard div instead of form) */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Subject Name
            </label>
            <input
              className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
              placeholder="e.g. Advanced Mathematics"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Student Roll Numbers (Paste comma-separated)
            </label>
            <textarea
              className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container resize-none rounded-lg outline-none text-on-surface"
              placeholder="24CSE01, 24CSE02, 24CSE03..."
              rows={6}
              value={rollNumbersText}
              onChange={(e) => setRollNumbersText(e.target.value)}
            />
          </div>

          <div className="flex justify-end items-center gap-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant font-label-lg text-label-lg hover:text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#10B981] text-white px-8 py-3 rounded-lg font-label-lg text-label-lg hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {editingClass ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
