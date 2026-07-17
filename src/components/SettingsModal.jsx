import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

export default function SettingsModal({ isOpen, onClose, user, onUserUpdate }) {
  const [currentView, setCurrentView] = useState('menu');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Reset view and sync input whenever the modal opens
  useEffect(() => {
    if (isOpen && user) {
      setCurrentView('menu');
      setUsername(user.user_metadata?.username || '');
      setFeedback({ type: '', message: '' });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Username cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { username: trimmed },
      });

      if (error) throw error;

      // Propagate the refreshed user object to App-level state
      if (onUserUpdate && data?.user) {
        onUserUpdate(data.user);
      }

      // Close the entire modal on success
      onClose();
    } catch (err) {
      console.error('Error updating username:', err.message);
      setFeedback({ type: 'error', message: err.message || 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentView('menu');
    setFeedback({ type: '', message: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div
        className="bg-white w-full max-w-lg p-12 flex flex-col gap-8 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {currentView !== 'menu' && (
              <button
                onClick={handleBack}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
            )}
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              {currentView === 'menu' ? 'Settings' : 'Username'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* ── Menu View ── */}
        {currentView === 'menu' && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setCurrentView('username')}
              className="w-full text-left flex items-center justify-between py-4 px-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <div>
                  <span className="font-body-md text-body-md font-medium text-on-surface">Username</span>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {user?.user_metadata?.username || 'Not set'}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
            </button>
          </div>
        )}

        {/* ── Username View ── */}
        {currentView === 'username' && (
          <>
            {/* Feedback banner */}
            {feedback.message && (
              <div
                className={`p-4 rounded-lg flex items-center gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {feedback.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span className="font-body-md">{feedback.message}</span>
              </div>
            )}

            {/* Form */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Username
                </label>
                <input
                  className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
                  placeholder="Enter your display name"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex justify-end items-center gap-6 mt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-on-surface-variant font-label-lg text-label-lg hover:text-on-surface transition-colors cursor-pointer"
                  disabled={isSaving}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#10B981] text-white px-8 py-3 rounded-lg font-label-lg text-label-lg hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  )}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
