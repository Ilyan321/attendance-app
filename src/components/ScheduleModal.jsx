import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DAY_COLORS = {
  Monday:    { bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700'    },
  Tuesday:   { bg: 'bg-violet-50',  border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  Wednesday: { bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700'},
  Thursday:  { bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700'   },
  Friday:    { bg: 'bg-rose-50',    border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-700'     },
};

export default function ScheduleModal({ isOpen, onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Add-form state
  const [newTitle, setNewTitle] = useState('');
  const [newDay,   setNewDay]   = useState('Monday');
  const [newTime,  setNewTime]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchSchedules = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await supabase
          .from('schedules')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('time', { ascending: true });
        if (fetchError) throw fetchError;
        setSchedules(data || []);
      } catch (err) {
        console.error('Error fetching schedules:', err.message);
        setError('Failed to load schedule.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [isOpen]);

  const handleDeleteSchedule = async (id) => {
    const confirmed = window.confirm('Delete this schedule item?');
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting schedule:', err.message);
    }
  };

  const handleAddSchedule = async () => {
    setFormError('');
    if (!newTitle.trim()) { setFormError('Title is required.'); return; }
    if (!newTime.trim())  { setFormError('Time is required.');  return; }
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert({ title: newTitle.trim(), day_of_week: newDay, time: newTime.trim() })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSchedules((prev) =>
          [...prev, data[0]].sort((a, b) => {
            const dayDiff = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
            return dayDiff !== 0 ? dayDiff : (a.time || '').localeCompare(b.time || '');
          })
        );
      }
      setNewTitle('');
      setNewTime('');
      setNewDay('Monday');
    } catch (err) {
      console.error('Error adding schedule:', err);
      setFormError(err.message || JSON.stringify(err));
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div
        className="bg-white w-[98vw] max-w-[1200px] h-[90vh] flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex justify-between items-start px-10 py-7 border-b border-[#E5E7EB] shrink-0">
          <div>
            <p className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest mb-1">
              Weekly Overview
            </p>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-black">
              Schedule &amp; Deadlines
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-auto px-8 py-6 space-y-8">

          {loading && (
            <div className="flex items-center justify-center h-40 gap-3 text-primary font-semibold">
              <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
              Loading schedule...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg font-body-md">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ── Mon–Fri Grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {DAYS.map((day) => {
                  const daySessions = schedules.filter((s) => s.day_of_week === day);
                  const colors = DAY_COLORS[day];
                  return (
                    <div
                      key={day}
                      className={`${colors.bg} ${colors.border} border rounded-xl p-4 flex flex-col gap-3 min-h-[160px]`}
                    >
                      {/* Day label */}
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded self-start ${colors.badge}`}>
                        {day}
                      </span>

                      {daySessions.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/60 italic mt-2">No sessions</p>
                      ) : (
                        daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-white/80 flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-on-surface truncate">
                                {session.title}
                              </p>
                              <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                {session.time}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(session.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded cursor-pointer transition-colors duration-200 shrink-0"
                              title="Delete this item"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Add New Item ── */}
              <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-6">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
                  Add Schedule Item
                </h3>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg mb-4">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CS101 Lecture"
                      className="bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      disabled={adding}
                    />
                  </div>

                  {/* Day */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Day
                    </label>
                    <select
                      className="bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      disabled={adding}
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Time
                    </label>
                    <input
                      type="time"
                      className="bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      disabled={adding}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    disabled={adding}
                    className="bg-[#10B981] text-white px-8 py-2.5 rounded-lg font-label-lg text-label-lg hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {adding ? 'Saving…' : 'Add to Schedule'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-10 py-5 border-t border-[#E5E7EB] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-surface-container text-on-surface px-8 py-2.5 rounded-lg font-label-lg text-label-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
