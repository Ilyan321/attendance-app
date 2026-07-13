import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

export default function HistoryModal({ isOpen, onClose, classId, className, totalRollNumbers }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !classId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setHistoryData(data || []);
      } catch (err) {
        console.error('Error fetching attendance history:', err.message);
        setError('Failed to load attendance history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, classId]);

  if (!isOpen) return null;

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div
        className="bg-white w-[95vw] max-w-[1100px] h-[85vh] flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start px-10 py-8 border-b border-[#E5E7EB] shrink-0">
          <div>
            <p className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest mb-1">
              Attendance History
            </p>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-black">
              {className}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {historyData.length} session{historyData.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-10 py-6">
          {loading && (
            <div className="flex items-center justify-center h-full gap-3 text-primary font-semibold">
              <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
              Loading history...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg font-body-md">
              {error}
            </div>
          )}

          {!loading && !error && historyData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40">
                event_busy
              </span>
              <p className="font-headline-sm text-headline-sm text-on-surface-variant font-semibold">
                No attendance sessions recorded yet.
              </p>
              <p className="font-body-md text-on-surface-variant max-w-sm">
                Take attendance for this class to see history here.
              </p>
            </div>
          )}

          {!loading && !error && historyData.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="sticky top-0 bg-white z-10">
                  {/* Roll number column header */}
                  <th className="text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider py-3 px-4 border-b-2 border-outline-variant whitespace-nowrap min-w-[120px]">
                    Roll No.
                  </th>
                  {/* One column per session */}
                  {historyData.map((session) => (
                    <th
                      key={session.id}
                      className="text-center font-label-md text-label-md text-on-surface-variant uppercase tracking-wider py-3 px-4 border-b-2 border-outline-variant min-w-[110px]"
                    >
                      <div className="font-bold text-on-surface truncate max-w-[120px] mx-auto" title={session.topic}>
                        {session.topic || '—'}
                      </div>
                      <div className="font-normal text-[11px] mt-0.5 text-on-surface-variant">
                        {formatDate(session.created_at)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(totalRollNumbers || []).map((roll, rowIdx) => (
                  <tr
                    key={roll}
                    className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-surface-container/40'}
                  >
                    <td className="py-3 px-4 font-label-md text-label-md text-on-surface font-semibold border-b border-outline-variant/30 whitespace-nowrap">
                      {roll}
                    </td>
                    {historyData.map((session) => {
                      const isPresent =
                        Array.isArray(session.present_students) &&
                        session.present_students.includes(roll);
                      return (
                        <td
                          key={session.id}
                          className="text-center py-3 px-4 border-b border-outline-variant/30 text-base"
                        >
                          {isPresent ? (
                            <span title="Present">✅</span>
                          ) : (
                            <span title="Absent">❌</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
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
