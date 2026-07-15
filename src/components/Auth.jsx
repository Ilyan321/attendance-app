import React, { useState } from 'react';
import supabase from './supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4 font-geist">
      <div className="w-full max-w-[400px] bg-white p-8 border border-[#E5E7EB] rounded-lg flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="material-symbols-outlined text-[32px] text-[#10B981]">
            school
          </span>
          <h1 className="text-[24px] font-black text-[#111827] tracking-tight">
            System Access
          </h1>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-3.5 rounded text-[14px] font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] p-3.5 rounded text-[14px] font-medium">
            {success}
          </div>
        )}

        {/* Form Container (Standard div instead of form) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              placeholder="teacher@school.edu"
              className="bg-[#F3F4F6] border-none text-[#111827] placeholder-[#9CA3AF] p-4 text-[14px] rounded outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="bg-[#F3F4F6] border-none text-[#111827] placeholder-[#9CA3AF] p-4 text-[14px] rounded outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#10B981] text-white p-4 text-[14px] font-bold rounded hover:bg-opacity-90 active:scale-98 transition-all cursor-pointer flex justify-center items-center"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </div>


      </div>
    </div>
  );
}
