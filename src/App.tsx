import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';
import { UserProfile, StudyPlanDay, UserProgress } from './types';
import { Layout } from './components/Layout';
import { SetupWizard } from './components/SetupWizard';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { generateMasterPlan } from './lib/studyPlanData';
import { Button } from './components/ui/button';
import { Loader2, Database } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlanDay[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setProfile(null);
        setPlan([]);
        setProgress([]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch Profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    // Fetch Master Plan
    // We no longer fetch from Firestore, we generate it locally based on profile.startDate
    if (profile) {
      const p = generateMasterPlan(profile.startDate, profile.settings?.includeSundays);
      setPlan(p);
      setLoading(false);
    }

    // Fetch User Progress
    const progressRef = collection(db, 'users', user.uid, 'progress');
    const unsubProgress = onSnapshot(progressRef, (snap) => {
      const pr = snap.docs.map(d => d.data() as UserProgress);
      setProgress(pr);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/progress`));

    return () => {
      unsubProfile();
      unsubProgress();
    };
  }, [user, profile?.startDate]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error("Login failed", err);
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-sans text-zinc-100">TCF Canada</h1>
            <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest">6-Month B2+ Study Planner</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-zinc-100 text-zinc-950 font-bold rounded-md hover:bg-zinc-200 transition-colors"
          >
            LOGIN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <SetupWizard userId={user.uid} email={user.email || ''} onComplete={() => {}} />;
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
      <Layout user={user} profile={profile as any} onNavigate={setView}>
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <CalendarView 
              startDate={profile.startDate} 
              plan={effectivePlan} 
              progress={progress} 
              userId={user.uid} 
            />
          </div>
        )}
        {view === 'profile' && <ProfileView profile={profile} onBack={() => setView('dashboard')} />}
        {view === 'settings' && <SettingsView profile={profile} onBack={() => setView('dashboard')} />}
        <Toaster />
      </Layout>
    </TooltipProvider>
  );
}

