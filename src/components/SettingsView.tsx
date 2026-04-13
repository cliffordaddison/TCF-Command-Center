import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';

interface SettingsViewProps {
  profile: UserProfile;
  onBack: () => void;
}

export function SettingsView({ profile, onBack }: SettingsViewProps) {
  const [notifHour, setNotifHour] = useState(profile.settings?.notificationHour ?? 8);
  const [includeSundays, setIncludeSundays] = useState(profile.settings?.includeSundays ?? false);
  const [startDate, setStartDate] = useState(profile.startDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetExamDate = format(addMonths(new Date(startDate), 6), 'yyyy-MM-dd');
      await updateDoc(doc(db, 'users', profile.uid), {
        'settings.notificationHour': notifHour,
        'settings.includeSundays': includeSundays,
        'startDate': startDate,
        'targetExamDate': targetExamDate
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">System Settings</h2>
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-none font-bold"
        >
          Back to Dashboard
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Study Plan Configuration</CardTitle>
          <CardDescription className="text-zinc-400">Manage your start date and weekly rhythm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-zinc-300">Plan Start Date</Label>
            <Input 
              id="startDate" 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
            <p className="text-[10px] text-zinc-500 italic">Changing this will automatically adjust your 6-month target date.</p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
            <div className="space-y-0.5">
              <Label htmlFor="includeSundays" className="text-zinc-300">Include Sundays</Label>
              <p className="text-xs text-zinc-500">Enable to include Sundays as lesson days instead of rest days.</p>
            </div>
            <Switch 
              id="includeSundays" 
              checked={includeSundays} 
              onCheckedChange={setIncludeSundays}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notifHour" className="text-zinc-300">Daily Notification Hour (0-23)</Label>
            <Input 
              id="notifHour" 
              type="number" 
              min={0}
              max={23}
              value={notifHour} 
              onChange={e => setNotifHour(parseInt(e.target.value))}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 border-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your TCF Planner.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full">Reset All Progress Data</Button>
        </CardContent>
      </Card>
    </div>
  );
}
