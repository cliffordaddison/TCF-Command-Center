import React from 'react';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { User, Calendar, Target, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileViewProps {
  profile: UserProfile;
  onBack: () => void;
}

export function ProfileView({ profile, onBack }: ProfileViewProps) {
  const email = profile?.email || 'user@example.com';
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">User Profile</h2>
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-none font-bold"
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-zinc-100">{email.split('@')[0]}</CardTitle>
            <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">Candidate</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Mail className="w-4 h-4 text-zinc-500" />
              <span>{email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>Started: {format(new Date(profile.startDate), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Target className="w-4 h-4 text-zinc-500" />
              <span>Target Exam: {format(new Date(profile.targetExamDate), 'PPP')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Study Parameters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Notification Schedule</p>
              <p className="text-2xl font-bold text-blue-500">Daily at {profile.settings?.notificationHour ?? 8}:00</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Plan Duration</p>
              <p className="text-2xl font-bold text-zinc-100">180 Days (6 Months)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
