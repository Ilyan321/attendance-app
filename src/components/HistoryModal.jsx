import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import DownloadModal from './DownloadModal';
import supabase from './supabaseClient';

export default function HistoryModal({ isOpen, onClose, classId, className, totalRollNumbers }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 'desc' = highest first, 'asc' = lowest first, null = original roll-number order
  const [sortDir, setSortDir] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

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

  // Pre-compute attendance rate for each roll number
  const totalSessions = historyData.length;
  const rateForRoll = (roll) => {
    if (totalSessions === 0) return null;
    const attended = historyData.filter(
      (s) => Array.isArray(s.present_students) && s.present_students.includes(roll)
    ).length;
    return parseFloat(((attended / totalSessions) * 100).toFixed(1));
  };

  // Build rows array — sorted if the user has clicked the header, else original order
  const baseRolls = totalRollNumbers || [];
  const sortedRolls = sortDir
    ? [...baseRolls].sort((a, b) => {
        const ra = rateForRoll(a) ?? 0;
        const rb = rateForRoll(b) ?? 0;
        return sortDir === 'desc' ? rb - ra : ra - rb;
      })
    : baseRolls;

  const toggleSort = () =>
    setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));

  const sortIcon = sortDir === 'desc' ? 'arrow_downward' : sortDir === 'asc' ? 'arrow_upward' : 'unfold_more';

  const handleDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId);
  };

  const executeDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', sessionToDelete);
      if (error) throw error;
      setHistoryData((prev) => prev.filter((s) => s.id !== sessionToDelete));
    } catch (err) {
      console.error('Error deleting attendance session:', err.message);
    } finally {
      setSessionToDelete(null);
    }
  };

  const handleDownloadExport = (fileType) => {
    if (fileType === 'csv') {
      const headers = ['Date', 'Topic', 'Present Students', 'Absent Students', 'Total Students', 'Attendance %'];
      
      const csvRows = historyData.map((session) => {
        const date = new Date(session.created_at).toLocaleDateString('en-GB');
        const topic = `"${(session.topic || '').replace(/"/g, '""')}"`;
        const presentRolls = session.present_students || [];
        const presentStr = `"${presentRolls.join('; ')}"`;
        const total = totalRollNumbers ? totalRollNumbers.length : 0;
        const presentCount = presentRolls.length;
        const absentCount = Math.max(0, total - presentCount);
        const percentage = total === 0 ? '100%' : `${((presentCount / total) * 100).toFixed(1)}%`;
        
        return [date, topic, presentStr, absentCount, total, percentage].join(',');
      });
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${className?.replace(/\s+/g, '_')}_Attendance_History.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setDownloadModalOpen(false);
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
          <div className="flex items-center gap-2">
            {historyData.length > 0 && (
              <button
                type="button"
                onClick={() => setDownloadModalOpen(true)}
                className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer px-4 py-2 rounded-full font-label-md text-label-md font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Export
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>
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
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id)}
                        className="mt-2 flex items-center justify-center mx-auto text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1.5 cursor-pointer transition-colors duration-200"
                        title="Delete this session"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </th>
                  ))}
                  {/* Attendance Rate column header — clickable to sort */}
                  <th
                    className="text-center font-label-md text-label-md text-on-surface-variant uppercase tracking-wider py-3 px-4 border-b-2 border-outline-variant min-w-[140px] cursor-pointer select-none hover:bg-surface-container/60 transition-colors"
                    onClick={toggleSort}
                    title="Click to sort by attendance rate"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold text-on-surface">Attendance Rate</span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{sortIcon}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRolls.map((roll, rowIdx) => {
                  const rate = rateForRoll(roll);
                  const isAtRisk = rate !== null && rate < 75;
                  return (
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
                      {/* Attendance Rate cell */}
                      <td className="text-center py-3 px-4 border-b border-outline-variant/30 whitespace-nowrap">
                        {rate === null ? (
                          <span className="text-on-surface-variant text-sm">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                              isAtRisk
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                            title={isAtRisk ? 'Below 75% — at risk' : 'Attendance OK'}
                          >
                            {isAtRisk && (
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                            )}
                            {rate % 1 === 0 ? `${rate}%` : `${rate}%`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      <ConfirmModal
        isOpen={!!sessionToDelete}
        title="Delete Attendance Session"
        message="Are you sure you want to delete this entire attendance session? This will remove the record for all students and cannot be undone."
        onConfirm={executeDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />

      <DownloadModal
        isOpen={downloadModalOpen}
        title="Export Attendance History"
        onDownload={handleDownloadExport}
        onCancel={() => setDownloadModalOpen(false)}
      />
    </div>
  );
}
