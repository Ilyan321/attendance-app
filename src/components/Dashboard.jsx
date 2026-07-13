import React from 'react';
import supabase from './supabaseClient';

export default function Dashboard({ classes, onSelectClass, onOpenAddClass, onDeleteClass, onEditClass }) {
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

  return (
    <main className="max-w-[1440px] mx-auto p-12 mt-12 mb-24">
      {/* Semester Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="font-display text-display text-on-surface font-extrabold tracking-tight">
            Current Semester
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Managing {totalClasses} active {totalClasses === 1 ? 'section' : 'sections'} for Fall 2026
          </p>
        </div>
      </header>

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
            const hasTakenAttendance = cls.presentStudents && cls.presentStudents.length > 0;
            
            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className="bg-surface-container hover:bg-surface-container-high p-8 min-h-[220px] rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-300 border border-outline-variant hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-surface-container-lowest px-3 py-1.5 text-on-surface-variant font-label-md text-label-md rounded font-semibold tracking-wider border border-outline-variant/30">
                      {cls.subjectCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditClass(cls); }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-1 flex items-center justify-center cursor-pointer transition-colors duration-200"
                        title="Edit class"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClass(e, cls.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1 flex items-center justify-center cursor-pointer transition-colors duration-200"
                        title="Delete class"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-background font-bold line-clamp-2">
                    {cls.subjectName}
                  </h2>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/30 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                    <span className="font-label-md text-label-md">{numStudents} Students</span>
                  </div>
                  {hasTakenAttendance && (
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
                      Attendance Logged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spacer and Stats / Deadlines Footer */}
      <section className="mt-24 py-12 border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {/* Upcoming Deadlines */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Upcoming Deadlines
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors px-2 cursor-pointer rounded-lg">
                <span className="font-body-md text-body-md font-medium">Calculus Midterm Grading</span>
                <span className="font-label-md text-label-md text-tertiary font-semibold bg-tertiary-fixed px-3 py-1 rounded">
                  In 2 days
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors px-2 cursor-pointer rounded-lg">
                <span className="font-body-md text-body-md font-medium">World History Essay Feedback</span>
                <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded">
                  Next Monday
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/40 space-y-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Semester Quick Stats
            </h3>
            <div className="space-y-6">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Average Attendance
                </p>
                <p className="font-headline-lg text-headline-lg text-primary font-black mt-1">
                  {hasClasses && classesWithAttendance.length > 0 ? `${averageAttendance}%` : "—"}
                </p>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Active Sections
                </p>
                <p className="font-headline-lg text-headline-lg text-on-surface font-black mt-1">
                  {totalClasses}
                </p>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Total Enrolled Students
                </p>
                <p className="font-headline-lg text-headline-lg text-on-surface font-black mt-1">
                  {totalStudents}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
