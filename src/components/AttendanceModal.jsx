import React, { useState, useEffect } from 'react';

export default function AttendanceModal({ isOpen, classData, onClose, onSaveAttendance }) {
  const [topic, setTopic] = useState('Data Structures');
  const [presentRolls, setPresentRolls] = useState([]);

  // Sync state with classData when modal opens or classData changes
  useEffect(() => {
    if (classData) {
      setTopic(classData.attendanceTopic || 'Data Structures');
      setPresentRolls(classData.presentStudents || []);
    }
  }, [classData, isOpen]);

  if (!isOpen || !classData) return null;

  const totalStudents = classData.student_roll_numbers ? classData.student_roll_numbers.length : 0;
  const presentCount = presentRolls.length;
  const absentCount = totalStudents - presentCount;

  const toggleStudent = (roll) => {
    if (presentRolls.includes(roll)) {
      setPresentRolls(presentRolls.filter((r) => r !== roll));
    } else {
      setPresentRolls([...presentRolls, roll]);
    }
  };

  const handleSave = () => {
    onSaveAttendance(classData.id, presentRolls, topic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-[90vw] max-w-[1200px] h-[85vh] bg-surface-container-lowest flex flex-col p-12 overflow-hidden shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Close icon */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest mb-1">
              Taking Attendance
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-black">
              {classData.subjectName}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {totalStudents === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-low rounded-xl p-12 text-center gap-6">
            <span className="material-symbols-outlined text-[80px] text-tertiary">
              group_off
            </span>
            <div className="space-y-2">
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                No students enrolled in this class.
              </h3>
              <p className="font-body-md text-on-surface-variant max-w-md">
                Please delete this class or add students to take attendance.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-lg text-label-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Modal Actions and Stats */}
            <div className="flex flex-col gap-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="w-full md:w-1/3">
                  <label className="block font-label-md text-label-md text-secondary mb-2 uppercase tracking-wider font-semibold">
                    Today's Topic
                  </label>
                  <input
                    className="w-full bg-surface-container text-on-surface px-4 py-3 border-none focus:ring-2 focus:ring-primary-container font-body-md text-body-md rounded-lg outline-none"
                    placeholder="Topic here: "
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 w-full md:w-auto justify-end">
                  <button
                    onClick={onClose}
                    className="text-on-surface-variant hover:text-on-surface px-6 py-3 font-label-lg text-label-lg transition-colors cursor-pointer rounded-lg hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-primary-container text-on-primary px-8 py-3 font-label-lg text-label-lg rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary-container/20 cursor-pointer"
                  >
                    Submit Attendance
                  </button>
                </div>
              </div>
              <div className="flex gap-12 border-b border-outline-variant pb-6">
                <div className="font-headline-md text-headline-md text-primary font-bold">
                  Present: {presentCount}
                </div>
                <div className="font-headline-md text-headline-md text-secondary font-bold">
                  Absent: {absentCount}
                </div>
              </div>
            </div>

            {/* Attendance Grid */}
            <div className="flex-1 overflow-y-auto pr-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {classData.student_roll_numbers.map((roll) => {
                  const isPresent = presentRolls.includes(roll);
                  return (
                    <button
                      key={roll}
                      onClick={() => toggleStudent(roll)}
                      className={`p-8 font-label-lg text-label-lg text-center rounded-xl transition-all duration-200 cursor-pointer ${
                        isPresent
                          ? 'bg-surface-container-lowest border-4 border-primary-container text-primary font-bold shadow-md shadow-primary-container/10 scale-102'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-4 border-transparent'
                      }`}
                    >
                      {roll}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
