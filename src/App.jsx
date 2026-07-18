import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AddClassModal from './components/AddClassModal';
import AttendanceModal from './components/AttendanceModal';
import HistoryModal from './components/HistoryModal';
import SchedulePage from './components/SchedulePage';
import SettingsPage from './components/SettingsPage';
import Auth from './components/Auth';
import supabase from './components/supabaseClient';
import './App.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Global State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [activeAttendanceClassId, setActiveAttendanceClassId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryClass, setSelectedHistoryClass] = useState(null);
  const [schedules, setSchedules] = useState([]);

  // Callback from SettingsModal — patches session in-place so the new
  // username propagates everywhere without a hard refresh.
  const handleUserUpdate = useCallback((updatedUser) => {
    setSession((prev) => (prev ? { ...prev, user: updatedUser } : prev));
  }, []);

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
    if (!session?.user) {
      setIsLoadingClasses(false);
      return;
    }
    setIsLoadingClasses(true);
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
    } finally {
      setIsLoadingClasses(false);
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
  const handleAddClass = async ({ subjectName, department, student_roll_numbers }) => {
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
      department: department.trim(),
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
      throw err;
    }
  };

  // Update an existing class in database and local state
  const handleUpdateClass = async ({ subjectName, department, student_roll_numbers, ...rest }) => {
    if (!editingClass) return;
    try {
      const { error } = await supabase
        .from('classes')
        .update({ subjectName: subjectName.trim(), department: department.trim(), student_roll_numbers })
        .eq('id', editingClass.id);
      if (error) throw error;
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === editingClass.id
            ? { ...cls, subjectName: subjectName.trim(), department: department.trim(), student_roll_numbers }
            : cls
        )
      );
    } catch (err) {
      console.error('Error updating class:', err.message);
      throw err;
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
      throw err;
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
              <span className="text-xl font-bold">EduFocus Attendance Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-6 items-center">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAttendanceClassId(null);
                  navigate('/');
                }}
                className={`font-label-md text-label-md cursor-pointer transition-colors duration-200 ${
                  location.pathname === '/'
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant font-medium hover:text-primary px-3 py-1 rounded'
                }`}
              >
                Dashboard
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/schedule');
                }}
                className={`font-label-md text-label-md cursor-pointer transition-colors duration-200 ${
                  location.pathname === '/schedule'
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant font-medium hover:text-primary px-3 py-1 rounded'
                }`}
              >
                Schedule
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/settings');
                }}
                className={`font-label-md text-label-md cursor-pointer transition-colors duration-200 ${
                  location.pathname === '/settings'
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant font-medium hover:text-primary px-3 py-1 rounded'
                }`}
              >
                Settings
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
        <Routes>
          <Route path="/" element={
            <Dashboard
              classes={classes}
              onSelectClass={(id) => setActiveAttendanceClassId(id)}
              onOpenAddClass={() => setIsAddClassOpen(true)}
              onDeleteClass={(id) => setClasses((prev) => prev.filter((cls) => cls.id !== id))}
              onEditClass={(cls) => { setEditingClass(cls); setIsAddClassOpen(true); }}
              onViewHistory={(cls) => { setSelectedHistoryClass(cls); setHistoryModalOpen(true); }}
              upcomingSchedules={schedules}
              onOpenSchedule={() => navigate('/schedule')}
              user={session.user}
              isLoading={isLoadingClasses}
            />
          } />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage user={session.user} onUserUpdate={handleUserUpdate} />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-low border-t border-outline-variant/50 pt-16 pb-24 md:pb-12">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            {/* Brand Section */}
            <div className="md:w-1/3">
              <span className="font-headline-md text-headline-md text-on-surface flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[28px]">school</span>
                </div>
                <span className="text-2xl font-black tracking-tight">EduFocus</span>
              </span>
              <p className="text-on-surface-variant font-body-lg text-lg max-w-sm leading-relaxed">
                Modern attendance tracking and academic session management, designed for the next generation of educators.
              </p>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 md:w-2/3">
              {/* Product */}
              <div className="flex flex-col gap-6">
                <h4 className="font-label-lg text-on-surface font-bold uppercase tracking-widest text-xs">Product</h4>
                <nav className="flex flex-col gap-4">
                  <button onClick={() => navigate('/')} className="text-left font-body-md text-on-surface-variant hover:text-primary transition-colors w-fit">Dashboard</button>
                  <button onClick={() => navigate('/schedule')} className="text-left font-body-md text-on-surface-variant hover:text-primary transition-colors w-fit">Schedule</button>
                  <button onClick={() => navigate('/settings')} className="text-left font-body-md text-on-surface-variant hover:text-primary transition-colors w-fit">Settings</button>
                </nav>
              </div>

              {/* Resources */}
              <div className="flex flex-col gap-6">
                <h4 className="font-label-lg text-on-surface font-bold uppercase tracking-widest text-xs">Resources</h4>
                <nav className="flex flex-col gap-4">
                  <a href="https://github.com/Ilyan321/attendance-app" target="_blank" rel="noopener noreferrer" className="font-body-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 group w-fit">
                    GitHub Repo
                    <span className="material-symbols-outlined text-[16px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_outward</span>
                  </a>
                  <span className="font-body-md text-on-surface-variant cursor-not-allowed opacity-60 w-fit">Documentation</span>
                </nav>
              </div>

              {/* Team */}
              <div className="flex flex-col gap-6 col-span-2 md:col-span-1 border-t border-outline-variant/30 md:border-none pt-8 md:pt-0">
                <h4 className="font-label-lg text-on-surface font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">code</span>
                  Developed By
                </h4>
                <div className="flex flex-col gap-4 font-body-md text-on-surface-variant">
                  <span className="flex items-center gap-3 hover:text-on-surface transition-colors cursor-default">
                    <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface shadow-sm">I</span>
                    Ilyan Khan
                  </span>
                  <span className="flex items-center gap-3 hover:text-on-surface transition-colors cursor-default">
                    <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface shadow-sm">R</span>
                    Rameen Jalal
                  </span>
                  <span className="flex items-center gap-3 hover:text-on-surface transition-colors cursor-default">
                    <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface shadow-sm">Z</span>
                    Zainab 15 April
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-outline-variant/50 gap-4">
            <p className="font-body-sm text-sm text-on-surface-variant">
              © {new Date().getFullYear()} EduFocus. All rights reserved.
            </p>
            <div className="flex items-center gap-4 font-label-md text-xs text-on-surface-variant/80 uppercase tracking-widest font-semibold">
              <span className="bg-surface-container-high px-4 py-1.5 rounded-full shadow-sm text-on-surface">v1.0.0</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">groups</span>
                Team Seneca
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-40 flex justify-around items-center bg-surface-container-lowest py-3 border-t border-outline-variant md:hidden shadow-lg">
        <button 
          onClick={() => { setActiveAttendanceClassId(null); navigate('/'); }}
          className={`flex flex-col items-center justify-center cursor-pointer ${
            location.pathname === '/'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary transition-colors'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center transition-colors cursor-pointer ${
            location.pathname === '/schedule'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
          onClick={() => navigate('/schedule')}
        >
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="font-label-md text-label-md">Schedule</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center transition-colors cursor-pointer ${
            location.pathname === '/settings'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
          onClick={() => navigate('/settings')}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
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
    </div>
  );
}

export default App;
