import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import RoleSwitcherBar from './RoleSwitcherBar.jsx';
import SyncDrawer from './SyncDrawer.jsx';
import CommandPalette from './CommandPalette.jsx';
import PrincipalDashboard from '../dashboards/PrincipalDashboard.jsx';
import HodDashboard from '../dashboards/HodDashboard.jsx';
import FacultyDashboard from '../dashboards/FacultyDashboard.jsx';
import StudentDashboard from '../dashboards/StudentDashboard.jsx';
import SyncHealth from '../../pages/admin/SyncHealth.jsx';
import CurriculumTracker from '../../pages/academic/CurriculumTracker.jsx';
import TimetableMatrix from '../../pages/academic/TimetableMatrix.jsx';
import StudentLifecycle from '../../pages/academic/StudentLifecycle.jsx';
import AttendanceRegister from '../../pages/faculty/AttendanceRegister.jsx';
import AttendanceAnomalyPanel from '../../pages/admin/AttendanceAnomalyPanel.jsx';
import AssignmentWorkflow from '../../pages/lms/AssignmentWorkflow.jsx';
import SubjectLearningHub from '../../pages/lms/SubjectLearningHub.jsx';
import ExamResultsEngine from '../../pages/exams/ExamResultsEngine.jsx';
import ServiceDesk from '../../pages/services/ServiceDesk.jsx';
import CampusOperations from '../../pages/operations/CampusOperations.jsx';
import PlacementSkillPassport from '../../pages/placement/PlacementSkillPassport.jsx';
import PublicCertificateVerifier from '../../pages/verification/PublicCertificateVerifier.jsx';
import EarlyWarningDashboard from '../../pages/intelligence/EarlyWarningDashboard.jsx';
import AiAssistantDrawer from '../ai/AiAssistantDrawer.jsx';
import NotificationCenter from '../notifications/NotificationCenter.jsx';
import InstallPwaBanner from '../common/InstallPwaBanner.jsx';

export function AppShell() {
  const { activeRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [verifyHash, setVerifyHash] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/verify/')) {
      return window.location.pathname.replace('/verify/', '');
    }
    return '';
  });
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/verify/')) {
      return 'verify';
    }
    return 'dashboard';
  });

  // Global Keyboard Shortcuts (Cmd+J / Ctrl+J for AI Co-Pilot)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    if (currentView === 'early_warning') {
      return <EarlyWarningDashboard />;
    }
    if (currentView === 'sync_health') {
      return <SyncHealth />;
    }
    if (currentView === 'attendance_register') {
      return <AttendanceRegister />;
    }
    if (currentView === 'attendance_anomalies') {
      return <AttendanceAnomalyPanel />;
    }
    if (currentView === 'assignments') {
      return <AssignmentWorkflow />;
    }
    if (currentView === 'study_packs') {
      return <SubjectLearningHub />;
    }
    if (currentView === 'exams') {
      return <ExamResultsEngine />;
    }
    if (currentView === 'curriculum') {
      return <CurriculumTracker />;
    }
    if (currentView === 'timetable') {
      return <TimetableMatrix />;
    }
    if (currentView === 'students') {
      return <StudentLifecycle />;
    }
    if (currentView === 'services') {
      return <ServiceDesk />;
    }
    if (currentView === 'operations') {
      return <CampusOperations />;
    }
    if (currentView === 'placement') {
      return (
        <PlacementSkillPassport
          onNavigateToVerify={(h) => {
            setVerifyHash(h);
            setCurrentView('verify');
          }}
        />
      );
    }
    if (currentView === 'verify') {
      return (
        <PublicCertificateVerifier
          hash={verifyHash}
          onBack={() => setCurrentView('placement')}
        />
      );
    }

    switch (activeRole) {
      case 'PRINCIPAL':
      case 'SUPER_ADMIN':
      case 'COLLEGE_ADMIN':
        return <PrincipalDashboard />;
      case 'HOD':
        return <HodDashboard />;
      case 'FACULTY':
      case 'CLASS_ADVISOR':
        return <FacultyDashboard />;
      case 'STUDENT':
      case 'PARENT':
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Development & Demo Role Switcher Dock */}
      <RoleSwitcherBar />

      {/* 2. Main Shell Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Glassmorphic Sidebar */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        {/* Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* Sticky Header with Dynamic Sync Island */}
          <Header
            onOpenCommandPalette={() => setCmdPaletteOpen(true)}
            onOpenAiAssistant={() => setAiDrawerOpen(true)}
            onOpenNotifications={() => setNotifsOpen(true)}
            currentView={currentView}
            onSelectView={setCurrentView}
          />

          {/* Main Content Area */}
          <main className="flex-1 pb-16">
            {renderContent()}
          </main>

        </div>

      </div>

      {/* 3. Global Overlays & Modals */}
      <SyncDrawer onNavigateToSyncHealth={() => setCurrentView('sync_health')} />
      <CommandPalette onNavigate={setCurrentView} />
      <AiAssistantDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
      <NotificationCenter isOpen={notifsOpen} onClose={() => setNotifsOpen(false)} />
      <InstallPwaBanner />

    </div>
  );
}

export default AppShell;
