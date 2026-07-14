import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AddClassModal from './components/AddClassModal';
import AttendanceModal from './components/AttendanceModal';
import HistoryModal from './components/HistoryModal';
import ScheduleModal from './components/ScheduleModal';
import Auth from './components/Auth';
import supabase from './components/supabaseClient';
import './App.css';

function App() {
  // Global State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [activeAttendanceClassId, setActiveAttendanceClassId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryClass, setSelectedHistoryClass] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);

  // Monitor Supabase Authentication state
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch(err => console.error('🚨 GET SESSION ERROR:', err));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🚨 AUTH EVENT FIRED:', event);
      if (event === 'SIGNED_OUT') {
        console.error('GHOST LOGOUT: Supabase explicitly killed the session!');
      }
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchClasses = useCallback(async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err.message);
    }
  }, [session]);

  // Fetch classes when session changes
  useEffect(() => {
    if (session?.user) {
      fetchClasses();
    } else {
      setClasses([]);
    }
  }, [session, fetchClasses]);

  // Fetch schedules when session is available
  useEffect(() => {
    if (!session?.user) { setSchedules([]); return; }
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('time', { ascending: true });
        if (error) throw error;
        setSchedules(data || []);
      } catch (err) {
        console.error('Error fetching schedules:', err.message);
      }
    };
    fetchSchedules();
  }, [session]);

  // Add a new class to database
  const handleAddClass = async ({ subjectName, student_roll_numbers }) => {
    if (!session?.user) return;

    // Generate a clean subject/course code (e.g. "Advanced Mathematics" -> "ADV-MAT")
    const generateCode = (name) => {
      const cleanName = name.trim();
      const words = cleanName.split(/\s+/);
      if (words.length >= 2) {
        return (words[0].substring(0, 3) + '-' + words[1].substring(0, 3)).toUpperCase();
      } else if (cleanName.length > 0) {
        const prefix = cleanName.substring(0, Math.min(4, cleanName.length)).toUpperCase();
        return `${prefix}-101`;
      }
      return 'CLASS-101';
    };

    const newClass = {
      teacher_id: session.user.id,
      subjectName: subjectName.trim(),
      subjectCode: generateCode(subjectName),
      student_roll_numbers,
      presentStudents: [], // Initialize present students as empty
      attendanceTopic: 'Data Structures', // Default topic
    };

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([newClass])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setClasses((prevClasses) => [data[0], ...prevClasses]);
      } else {
        fetchClasses();
      }
    } catch (err) {
      console.error('Error adding class:', err.message);
      alert('Failed to add class: ' + err.message);
    }
  };

  // Update an existing class in database and local state
  const handleUpdateClass = async ({ subjectName, student_roll_numbers, ...rest }) => {
    if (!editingClass) return;
    try {
      const { error } = await supabase
        .from('classes')
        .update({ subjectName: subjectName.trim(), student_roll_numbers })
        .eq('id', editingClass.id);
      if (error) throw error;
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === editingClass.id
            ? { ...cls, subjectName: subjectName.trim(), student_roll_numbers }
            : cls
        )
      );
    } catch (err) {
      console.error('Error updating class:', err.message);
    } finally {
      setEditingClass(null);
      setIsAddClassOpen(false);
    }
  };

  // Save updated attendance details back to Supabase and state
  const handleSaveAttendance = async (classId, presentRollNumbers, topic) => {
    try {
      // 1. Log the attendance in the attendance_records table
      const { error: logError } = await supabase
        .from('attendance_records')
        .insert([
          {
            class_id: classId,
            present_students: presentRollNumbers,
            topic: topic
          }
        ]);

      if (logError) throw logError;

      // 2. Update the classes table with latest attendance info
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          presentStudents: presentRollNumbers,
          attendanceTopic: topic
        })
        .eq('id', classId);

      if (updateError) throw updateError;

      // 3. Update the local UI state
      setClasses((prevClasses) =>
        prevClasses.map((cls) =>
          cls.id === classId
            ? { ...cls, presentStudents: presentRollNumbers, attendanceTopic: topic }
            : cls
        )
      );
    } catch (err) {
      console.error('Error saving attendance:', err.message);
      alert('Failed to save attendance: ' + err.message);
    }
  };

  // Find the selected class for attendance
  const activeClass = classes.find((cls) => cls.id === activeAttendanceClassId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] font-geist">
        <div className="text-[16px] font-bold text-[#10B981] flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
          Loading Session...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 w-full z-40">
        <div className="flex justify-between items-center w-full px-12 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px] text-primary">school</span>
              <span className="text-xl"><span className="font-bold">EduFocus</span> <span className="font-normal">Attendance Portal</span></span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-6 items-center">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAttendanceClassId(null);
                }}
                className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md cursor-pointer"
              >
                Dashboard
              </button>
              <button 
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors duration-200 font-label-md text-label-md px-3 py-1 rounded cursor-pointer"
              >
                Schedule
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  supabase.auth.signOut();
                }}
                className="text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors duration-200 font-label-md text-label-md px-3 py-1 rounded cursor-pointer flex items-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </nav>


          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow pb-16">
        <Dashboard
          classes={classes}
          onSelectClass={(id) => setActiveAttendanceClassId(id)}
          onOpenAddClass={() => setIsAddClassOpen(true)}
          onDeleteClass={(id) => setClasses((prev) => prev.filter((cls) => cls.id !== id))}
          onEditClass={(cls) => { setEditingClass(cls); setIsAddClassOpen(true); }}
          onViewHistory={(cls) => { setSelectedHistoryClass(cls); setHistoryModalOpen(true); }}
          upcomingSchedules={schedules}
          onOpenSchedule={() => setScheduleModalOpen(true)}
          username={session.user.user_metadata?.username || session.user.email}
        />
      </div>

      {/* Footer */}
      <footer className="w-full bg-surface-container border-t border-outline-variant py-8 px-12 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-headline-sm text-headline-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">school</span>
            EduFocus Portal
          </div>
          <div className="flex gap-8">
            <a href="#" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors duration-200">
              Support
            </a>
            <a href="#" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors duration-200">
              Terms of Service
            </a>
          </div>
          <div className="font-label-md text-label-md text-secondary">
            © 2026 EduFocus Portal. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-40 flex justify-around items-center bg-surface-container-lowest py-3 border-t border-outline-variant md:hidden shadow-lg">
        <button 
          onClick={() => setActiveAttendanceClassId(null)}
          className="flex flex-col items-center justify-center text-primary font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          onClick={() => setScheduleModalOpen(true)}
        >
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="font-label-md text-label-md">Schedule</span>
        </button>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="flex flex-col items-center justify-center text-[#ba1a1a] hover:opacity-85 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </nav>

      {/* Modals */}
      <AddClassModal
        isOpen={isAddClassOpen}
        onClose={() => { setIsAddClassOpen(false); setEditingClass(null); }}
        onAddClass={handleAddClass}
        onUpdateClass={handleUpdateClass}
        editingClass={editingClass}
      />

      <AttendanceModal
        isOpen={!!activeAttendanceClassId}
        classData={activeClass}
        onClose={() => setActiveAttendanceClassId(null)}
        onSaveAttendance={handleSaveAttendance}
      />

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => { setHistoryModalOpen(false); setSelectedHistoryClass(null); }}
        classId={selectedHistoryClass?.id}
        className={selectedHistoryClass?.subjectName}
        totalRollNumbers={selectedHistoryClass?.student_roll_numbers}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
}

export default App;
