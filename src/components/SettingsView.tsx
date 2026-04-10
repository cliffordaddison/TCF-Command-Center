import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface SettingsViewProps {
  profile: UserProfile;
  onBack: () => void;
}

export function SettingsView({ profile, onBack }: SettingsViewProps) {
  const [notifHour, setNotifHour] = useState(profile.settings?.notificationHour ?? 8);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        'settings.notificationHour': notifHour
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
          <CardTitle className="text-zinc-100">Notification Preferences</CardTitle>
          <CardDescription className="text-zinc-400">Adjust when you receive your daily study reminders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
