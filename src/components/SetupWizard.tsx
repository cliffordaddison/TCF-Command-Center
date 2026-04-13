import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { addMonths, format } from 'date-fns';
import { storage } from '../lib/storage';

interface SetupWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    targetExamDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    notificationHour: 8
  });

  const handleStartDateChange = (dateStr: string) => {
    const newStartDate = new Date(dateStr);
    const newTargetDate = addMonths(newStartDate, 6);
    setFormData({
      ...formData,
      startDate: dateStr,
      targetExamDate: format(newTargetDate, 'yyyy-MM-dd')
    });
  };

  const handleSubmit = async () => {
    const profile: UserProfile = {
      uid: 'local-user',
      email: formData.email || 'local@user.com',
      settings: {
        notificationHour: formData.notificationHour,
        includeSundays: false
      },
      startDate: formData.startDate,
      targetExamDate: formData.targetExamDate
    };

    storage.saveProfile(profile);
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest">Step {step} of 2</span>
          </div>
          <CardTitle className="text-2xl font-bold">Initialize TCF Planner</CardTitle>
          <CardDescription className="text-zinc-400">Configure your 6-month preparation parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email (for local profile)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Clifford.Siisi.Addison@gmail.com"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Study Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={formData.startDate} 
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Exam Date</Label>
                <Input 
                  id="targetDate" 
                  type="date" 
                  value={formData.targetExamDate} 
                  onChange={e => setFormData({...formData, targetExamDate: e.target.value})}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700">Next Phase</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notifHour">Daily Email Notification Hour (24h)</Label>
                <Input 
                  id="notifHour" 
                  type="number" 
                  min={0} 
                  max={23}
                  value={formData.notificationHour} 
                  onChange={e => setFormData({...formData, notificationHour: parseInt(e.target.value)})}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-zinc-800">Back</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">Deploy Planner</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
