import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

export default function Dashboard({ classes, onSelectClass, onOpenAddClass, onDeleteClass, onEditClass, onViewHistory, upcomingSchedules, onOpenSchedule }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const hasClasses = classes.length > 0;

  const handleDeleteClass = async (e, classId) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this class? This cannot be undone.');
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) throw error;
      onDeleteClass(classId);
    } catch (err) {
      console.error('Error deleting class:', err.message);
    }
  };
  
  // Calculate stats dynamically
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_roll_numbers ? c.student_roll_numbers.length : 0), 0);
  
  // Calculate average attendance across classes where attendance was taken
  const classesWithAttendance = classes.filter(c => c.presentStudents && c.presentStudents.length > 0 || c.attendanceTopic);
  const averageAttendance = classesWithAttendance.length > 0
    ? (classesWithAttendance.reduce((acc, c) => {
        const total = c.student_roll_numbers ? c.student_roll_numbers.length : 0;
        if (total === 0) return acc + 100;
        const present = c.presentStudents ? c.presentStudents.length : 0;
        return acc + (present / total) * 100;
      }, 0) / classesWithAttendance.length).toFixed(1)
    : "0.0";

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const classesToday = upcomingSchedules?.filter(s => s.day_of_week === today)?.length || 0;

  return (
    <main className="max-w-[1440px] mx-auto p-12 mt-12 mb-24">
      {/* Semester Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-display text-on-surface font-extrabold tracking-tight">
            Current Semester
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Managing {totalClasses} active {totalClasses === 1 ? 'section' : 'sections'} for Fall 2026
          </p>
        </div>
      </header>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {/* Card 1 */}
        <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <span className="material-symbols-outlined">library_books</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Active Classes</p>
            <p className="text-2xl font-black text-on-surface">{totalClasses}</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined">event_available</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Classes Today</p>
            <p className="text-2xl font-black text-on-surface">{classesToday}</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Average Attendance</p>
            <p className="text-2xl font-black text-on-surface">
              {hasClasses && classesWithAttendance.length > 0 ? `${averageAttendance}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid/Empty State */}
      {!hasClasses ? (
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-20 flex flex-col items-center justify-center text-center gap-8 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-primary">
              school
            </span>
          </div>
          <div className="space-y-3">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              No classes created yet.
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-md">
              Get started by creating your first course and adding students. You can track attendance, topics, and more.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddClass}
            className="bg-primary-container text-on-primary px-8 py-3.5 rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-primary-container/20 cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Click 'Add Class' to begin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {classes.map((cls) => {
            const numStudents = cls.student_roll_numbers ? cls.student_roll_numbers.length : 0;
            const hasTakenAttendance = cls.presentStudents && cls.presentStudents.length > 0 || cls.attendanceTopic;
            
            let attendanceHealth = '--%';
            if (hasTakenAttendance) {
              if (numStudents === 0) {
                attendanceHealth = '100%';
              } else {
                const present = cls.presentStudents ? cls.presentStudents.length : 0;
                attendanceHealth = `${((present / numStudents) * 100).toFixed(1)}%`;
              }
            } else {
              attendanceHealth = 'No sessions yet';
            }
            
            return (
              <div
                key={cls.id}
                className="bg-surface-container p-8 min-h-[220px] rounded-xl flex flex-col justify-between transition-all duration-300 border border-outline-variant hover:shadow-lg relative group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-surface-container-lowest px-3 py-1.5 text-on-surface-variant font-label-md text-label-md rounded font-semibold tracking-wider border border-outline-variant/30">
                      {cls.subjectCode}
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === cls.id ? null : cls.id); }}
                        className="text-on-surface-variant hover:text-on-surface rounded-full p-1 flex items-center justify-center cursor-pointer transition-colors duration-200"
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === cls.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-outline-variant/30 z-10 py-2">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); onViewHistory(cls); }}
                          >
                            View History
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); onEditClass(cls); }}
                          >
                            Edit Class
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); handleDeleteClass(e, cls.id); }}
                          >
                            Delete Class
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-background font-bold line-clamp-2">
                    {cls.subjectName}
                  </h2>
                  <div className="text-sm text-gray-500 flex gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {numStudents}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                      {attendanceHealth}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/30">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectClass(cls.id); }}
                    className="w-full bg-primary text-on-primary font-bold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    Take Attendance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spacer and Deadlines Footer */}
      <section className="mt-24 py-12 border-t border-outline-variant">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Upcoming Schedule
            </h3>
            <button
              type="button"
              onClick={onOpenSchedule}
              className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              View Full Schedule
            </button>
          </div>
          <div className="space-y-4">
            {(!upcomingSchedules || upcomingSchedules.length === 0) ? (
              <div className="flex items-center gap-3 text-on-surface-variant py-4 text-sm italic">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
                No upcoming schedule items. Add some via View Full Schedule.
              </div>
            ) : (
              upcomingSchedules.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                    <span className="font-body-md text-body-md font-medium">{item.title}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded shrink-0">
                    {item.day_of_week} · {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
