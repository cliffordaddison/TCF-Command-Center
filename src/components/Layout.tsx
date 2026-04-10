import React from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface LayoutProps {
  user: User;
  profile: UserProfile;
  children: React.ReactNode;
  onNavigate: (view: 'dashboard' | 'profile' | 'settings') => void;
}

export function Layout({ user, profile, children, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">TCF</div>
            <div>
              <h1 className="text-sm font-bold leading-none">COMMAND CENTER</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">B2+ PROGRESSIVE OS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-mono text-zinc-500 uppercase">Study Phase</span>
              <span className="text-sm font-bold text-blue-400">6-Month B2+ Plan</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full border border-zinc-800 p-0 overflow-hidden size-8 hover:border-zinc-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
                <DropdownMenuItem 
                  className="flex items-center gap-2 focus:bg-zinc-800 focus:text-white cursor-pointer"
                  onClick={() => onNavigate('profile')}
                >
                  <UserIcon className="w-4 h-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 focus:bg-zinc-800 focus:text-white cursor-pointer"
                  onClick={() => onNavigate('settings')}
                >
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  onClick={() => auth.signOut()}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>

      <footer className="border-t border-zinc-900 py-8 mt-12 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
            The 4-3-2-1 Rhythm Algorithm • Version 1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
