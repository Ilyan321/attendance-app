import React, { useState } from 'react';
import supabase from './supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative font-geist">
      {/* Enterprise Branding Header */}
      <header className="absolute top-0 left-0 w-full z-20 select-none border-b border-surface-container-highest bg-background">
        <div className="px-6 py-5 md:px-10 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[26px] text-primary-container">
            school
          </span>
          <h2 className="text-[20px] tracking-tight font-bold text-primary-container">
            EduFocus Attendance Portal
          </h2>
        </div>
      </header>

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 40L40 0' fill='none' stroke='%23dde4dd' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="w-full max-w-[400px] bg-surface-container-lowest p-10 border-t-4 border-b-4 border-primary shadow-2xl shadow-[#6c7a71]/20 z-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[36px] text-primary">
            school
          </span>
          <h1 className="text-[24px] font-bold text-on-background tracking-tight">
            Sign in to EduFocus
          </h1>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="bg-error-container text-on-error-container p-3 text-[14px] font-medium border border-[#ffdad6]">
            {error}
          </div>
        )}

        {/* Form Container */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-on-surface-variant">
              Email Address
            </label>
            <input
              type="email"
              placeholder="teacher@school.edu"
              className="bg-surface-container-low border-2 border-transparent text-on-background placeholder-secondary p-3 text-[15px] outline-none focus:border-primary transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="bg-surface-container-low border-2 border-transparent text-on-background placeholder-secondary p-3 text-[15px] outline-none focus:border-primary transition-colors"
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
            className="w-full bg-primary text-on-primary p-3.5 text-[15px] font-bold hover:bg-opacity-90 transition-colors cursor-pointer mt-2"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </div>

        {/* Contact Administrator Link */}
        <div className="text-center pt-2">
          <a
            href="mailto:ilyaankhan342@gmail.com?subject=Access%20Request%3A%20EduFocus%20Attendance%20Portal&body=Hello%2C%20I%20am%20requesting%20teacher%20access%20credentials%20for%20the%20EduFocus%20portal.%0D%0A%0D%0ARequested%20Details%3A%0D%0AEmail%3A%20%0D%0AUsername%3A%20"
            className="text-[14px] text-secondary hover:text-on-surface-variant transition-colors font-medium"
          >
            Need access? Contact Administrator
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 w-full text-center z-10">
        <p className="text-[13px] font-medium text-on-surface-variant">
          EduFocus Portal © 2026 | Developed by Team Seneca
        </p>
      </footer>
    </div>
  );
}
