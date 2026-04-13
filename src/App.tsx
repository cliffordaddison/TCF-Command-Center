import React, { useState, useEffect } from 'react';
import { UserProfile, StudyPlanDay, UserProgress } from './types';
import { Layout } from './components/Layout';
import { SetupWizard } from './components/SetupWizard';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { generateMasterPlan } from './lib/studyPlanData';
import { storage } from './lib/storage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlanDay[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    // Load data from LocalStorage
    const p = storage.getProfile();
    const pr = storage.getProgress();
    
    setProfile(p);
    setProgress(pr);
    
    if (p) {
      const masterPlan = generateMasterPlan(p.startDate, p.settings?.includeSundays);
      setPlan(masterPlan);
    }
    
    setLoading(false);
  }, []);

  // Browser Notification Logic
  useEffect(() => {
    if (!profile || !profile.settings?.notificationHour) return;

    const checkNotifications = () => {
      const now = new Date();
      if (now.getHours() === profile.settings?.notificationHour && now.getMinutes() === 0) {
        if (Notification.permission === 'granted') {
          new Notification('TCF Study Reminder', {
            body: "It's time for your daily TCF study session! Open your dashboard to see today's tasks.",
            icon: '/favicon.ico'
          });
        }
      }
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profile]);

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <div className="animate-pulse text-sm font-mono uppercase tracking-widest">Initializing TCF Command Center...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <SetupWizard onComplete={(newProfile) => {
      setProfile(newProfile);
      const masterPlan = generateMasterPlan(newProfile.startDate, newProfile.settings?.includeSundays);
      setPlan(masterPlan);
      handleRequestPermission();
    }} />;
  }

  const effectivePlan = plan.map(day => {
    // Find failed tests from 3 days ago
    const threeDaysAgo = day.day - 3;
    const pastProgress = progress.find(p => p.dayNumber === threeDaysAgo);
    const failedTests = pastProgress?.tasks.filter(t => t.score !== undefined && t.score < 35) || [];
    
    const extraTasks = failedTests.map(ft => {
      const originalDay = plan.find(d => d.day === threeDaysAgo);
      const originalTask = originalDay?.tasks.find(t => t.id === ft.id);
      return {
        id: `review-${ft.id}-${day.day}`,
        type: 'tcf_review' as const,
        title: `Review: ${originalTask?.title || 'TCF Test'}`,
        description: `Score was ${ft.score}/39. Re-take this test and aim for 35/39. Analyze errors carefully. Use AmiGrade workflow: explain why other options are wrong.`,
        resourceLink: originalTask?.resourceLink,
        testId: originalTask?.testId
      };
    });

    return {
      ...day,
      tasks: [...day.tasks, ...extraTasks]
    };
  });

  return (
    <TooltipProvider>
      <Layout profile={profile} onNavigate={setView}>
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <CalendarView 
              startDate={profile.startDate} 
              plan={effectivePlan} 
              progress={progress} 
              onProgressUpdate={(newProgress) => {
                setProgress(newProgress);
                storage.saveProgress(newProgress);
              }}
            />
          </div>
        )}
        {view === 'profile' && <ProfileView profile={profile} onBack={() => setView('dashboard')} />}
        {view === 'settings' && (
          <SettingsView 
            profile={profile} 
            onBack={() => setView('dashboard')} 
            onUpdate={(updated) => {
              setProfile(updated);
              storage.saveProfile(updated);
              const masterPlan = generateMasterPlan(updated.startDate, updated.settings?.includeSundays);
              setPlan(masterPlan);
            }}
            onReset={() => {
              storage.clearAll();
              window.location.reload();
            }}
          />
        )}
        <Toaster />
      </Layout>
    </TooltipProvider>
  );
}

