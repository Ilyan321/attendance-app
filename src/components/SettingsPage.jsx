import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

export default function SettingsPage({ user, onUserUpdate }) {
  const navigate = useNavigate();
  
  // Views: 'list' | 'username' | 'password'
  const [activeView, setActiveView] = useState('list');
  
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || '');
    }
  }, [user]);

  const goBackToList = () => {
    setActiveView('list');
    setFeedback({ type: '', message: '' });
    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdateUsername = async () => {
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

      if (onUserUpdate && data?.user) {
        onUserUpdate(data.user);
      }

      setFeedback({ type: 'success', message: 'Username updated successfully.' });
      setTimeout(() => goBackToList(), 1500);
    } catch (err) {
      console.error('Error updating username:', err.message);
      setFeedback({ type: 'error', message: err.message || 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      setFeedback({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      // 1. Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Incorrect current password.');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: 'Password updated successfully.' });
      setTimeout(() => goBackToList(), 1500);
    } catch (err) {
      console.error('Error updating password:', err.message);
      setFeedback({ type: 'error', message: err.message || 'Password update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-12 mt-4 md:mt-12 mb-24 animate-in fade-in duration-300">
      
      {/* ── LIST VIEW ── */}
      {activeView === 'list' && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </button>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Settings</h1>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
            {/* Update Username Item */}
            <button
              onClick={() => { setActiveView('username'); setFeedback({ type: '', message: '' }); }}
              className="w-full flex items-center justify-between p-6 bg-transparent hover:bg-surface-container transition-colors cursor-pointer text-left border-b border-outline-variant/30 active:bg-surface-container-high"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <h3 className="font-body-lg text-on-surface font-semibold">Update Username</h3>
                  <p className="text-sm text-on-surface-variant">Current: {user?.user_metadata?.username || 'Not set'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>

            {/* Update Password Item */}
            <button
              onClick={() => { setActiveView('password'); setFeedback({ type: '', message: '' }); }}
              className="w-full flex items-center justify-between p-6 bg-transparent hover:bg-surface-container transition-colors cursor-pointer text-left active:bg-surface-container-high"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <h3 className="font-body-lg text-on-surface font-semibold">Update Password</h3>
                  <p className="text-sm text-on-surface-variant">Change your account password</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </>
      )}

      {/* ── USERNAME VIEW ── */}
      {activeView === 'username' && (
        <div className="animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={goBackToList}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </button>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Update Username</h1>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            {feedback.message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${
                feedback.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {feedback.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span className="font-body-md">{feedback.message}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-8">
              <label className="font-label-md text-on-surface-variant uppercase tracking-wider">
                Display Name
              </label>
              <input
                className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
                placeholder="Enter new username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={goBackToList}
                className="flex-1 py-3 font-label-lg rounded-lg text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUsername}
                disabled={isSaving}
                className="flex-1 py-3 font-label-lg rounded-lg text-white bg-primary hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORD VIEW ── */}
      {activeView === 'password' && (
        <div className="animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={goBackToList}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </button>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Update Password</h1>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            {feedback.message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${
                feedback.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-800'
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {feedback.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span className="font-body-md">{feedback.message}</span>
              </div>
            )}

            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
                  placeholder="Enter current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant uppercase tracking-wider">
                  New Password
                </label>
                <input
                  className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
                  placeholder="Enter new password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  className="bg-[#F3F4F6] border-none p-4 font-body-md focus:ring-2 focus:ring-primary-container rounded-lg outline-none text-on-surface"
                  placeholder="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={goBackToList}
                className="flex-1 py-3 font-label-lg rounded-lg text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isSaving}
                className="flex-1 py-3 font-label-lg rounded-lg text-white bg-primary hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? 'Updating...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
