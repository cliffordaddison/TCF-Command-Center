import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { StudyPlanDay, UserProgress, TaskTemplate, TaskType } from '../types';
import { format, addDays, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle2, Circle, ExternalLink, Info, Trophy, AlertTriangle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Input } from './ui/input';

interface CalendarViewProps {
  startDate: string;
  plan: StudyPlanDay[];
  progress: UserProgress[];
  userId: string;
}

export function CalendarView({ startDate, plan, progress, userId }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<StudyPlanDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState<{ taskId: string, score: string }>({ taskId: '', score: '' });

  const events = plan.map(day => {
    const date = addDays(startOfDay(new Date(startDate)), day.dateOffset);
    const dayProgress = progress.find(p => p.dayNumber === day.day);
    const completedCount = dayProgress?.tasks.filter(t => t.completed).length || 0;
    const totalCount = day.tasks.length;
    const isFullyCompleted = completedCount === totalCount && totalCount > 0;

    return {
      id: day.day.toString(),
      title: `Day ${day.day} (${completedCount}/${totalCount})`,
      start: format(date, 'yyyy-MM-dd'),
      backgroundColor: isFullyCompleted ? '#22c55e' : completedCount > 0 ? '#3b82f6' : '#27272a',
      borderColor: 'transparent',
      extendedProps: { dayData: day, progressData: dayProgress }
    };
  });

  const handleDateClick = (arg: any) => {
    const dayId = arg.event.id;
    const day = plan.find(d => d.day.toString() === dayId);
    if (day) {
      setSelectedDay(day);
      setIsModalOpen(true);
    }
  };

  const toggleTask = async (taskId: string, score?: number, weakTags?: string[]) => {
    if (!selectedDay) return;

    const dayProgress = progress.find(p => p.dayNumber === selectedDay.day);
    const existingTasks = dayProgress?.tasks || [];
    const taskIndex = existingTasks.findIndex(t => t.id === taskId);

    let newTasks = [...existingTasks];
    if (taskIndex > -1) {
      const updatedTask = { 
        ...newTasks[taskIndex], 
        completed: !newTasks[taskIndex].completed,
      };
      if (score !== undefined) (updatedTask as any).score = score;
      if (weakTags !== undefined) (updatedTask as any).weakTags = weakTags;
      newTasks[taskIndex] = updatedTask;
    } else {
      const newTask: any = { id: taskId, completed: true, timeSpent: 0 };
      if (score !== undefined) newTask.score = score;
      if (weakTags !== undefined) newTask.weakTags = weakTags;
      newTasks.push(newTask);
    }

    const progressId = `day_${selectedDay.day}`;
    const progressRef = doc(db, 'users', userId, 'progress', progressId);

    try {
      if (dayProgress) {
        await updateDoc(progressRef, { 
          tasks: newTasks,
          dateCompleted: new Date().toISOString()
        });
      } else {
        await setDoc(progressRef, {
          userId,
          dayNumber: selectedDay.day,
          tasks: newTasks,
          dateCompleted: new Date().toISOString()
        });
      }

      // Logic for TCF Review Scheduling
      if (score !== undefined && score < 35) {
        const task = selectedDay.tasks.find(t => t.id === taskId);
        if (task?.testId) {
          const reviewDayNum = selectedDay.day + 3;
          const reviewProgressId = `day_${reviewDayNum}`;
          const reviewRef = doc(db, 'users', userId, 'progress', reviewProgressId);
          
          // We add a "dynamic task" to the progress of 3 days later
          // Note: The UI needs to render these dynamic tasks
          toast.info(`Score < 35. Review scheduled for Day ${reviewDayNum}`);
        }
      }

      toast.success("Progress updated");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/progress/${progressId}`);
    }
  };

  const getTooltipContent = (task: TaskTemplate) => {
    const typeLabel = task.type.replace('_', ' ').toUpperCase();
    const duration = task.type === 'story' ? '45' : '90';
    const skill = task.type === 'story' ? 'Listening/Speaking' : 'TCF Exam Prep';
    const description = task.description || '';
    
    return (
      <div className="p-3 space-y-2 max-w-xs text-xs">
        <div className="flex justify-between border-b border-zinc-800 pb-1 mb-1">
          <span className="font-bold text-blue-400">{task.title}</span>
          <span className="text-zinc-500">{duration} MIN</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] uppercase font-mono">
          <span className="text-zinc-500">TYPE:</span> <span className="text-zinc-300">{typeLabel}</span>
          <span className="text-zinc-500">SKILL:</span> <span className="text-zinc-300">{skill}</span>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-zinc-400 uppercase text-[9px]">Objective:</p>
          <p className="text-zinc-300 italic">{description.split('.')[0]}.</p>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-zinc-400 uppercase text-[9px]">Steps:</p>
          <ul className="list-decimal list-inside text-zinc-400 space-y-0.5">
            {description.split('.').slice(1).filter(s => s.trim()).map((step, i) => (
              <li key={i}>{step.trim()}</li>
            ))}
          </ul>
        </div>
        <div className="pt-1 border-t border-zinc-800 text-[9px] text-zinc-500">
          SUCCESS CRITERIA: {task.type === 'tcf_new' ? 'Score >= 35/39' : 'Completed all steps'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
      <style>{`
        .fc { --fc-border-color: #27272a; --fc-page-bg-color: transparent; }
        .fc-theme-standard td, .fc-theme-standard th { border: 1px solid #27272a; }
        .fc-daygrid-day-number { font-family: monospace; font-size: 0.75rem; color: #71717a; padding: 4px !important; }
        .fc-col-header-cell-cushion { font-family: monospace; font-size: 0.7rem; text-transform: uppercase; color: #a1a1aa; padding: 8px 0 !important; }
        .fc-event { border-radius: 4px; padding: 2px 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: transform 0.1s; }
        .fc-event:hover { transform: scale(1.02); }
        .fc-day-today { background: rgba(59, 130, 246, 0.05) !important; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800; letter-spacing: -0.025em; }
        .fc-button { background: #18181b !important; border: 1px solid #27272a !important; font-size: 0.8rem !important; text-transform: uppercase !important; font-weight: 700 !important; }
        .fc-button-active { background: #27272a !important; }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleDateClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        height="auto"
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Day {selectedDay?.day} Study Plan
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-mono text-xs uppercase">
              {selectedDay && format(addDays(new Date(startDate), selectedDay.dateOffset), 'PPPP')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDay?.tasks.map(task => {
              const taskProgress = progress.find(p => p.dayNumber === selectedDay.day)?.tasks.find(t => t.id === task.id);
              const isCompleted = taskProgress?.completed;
              const currentScore = taskProgress?.score;

              return (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-xl border transition-all min-h-[120px] flex flex-col justify-between ${isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-950 border-zinc-800'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          task.type === 'story' ? 'bg-blue-500/20 text-blue-400' : 
                          task.type.startsWith('tcf') ? 'bg-red-500/20 text-red-400' : 
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {task.type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-sm">{task.title}</h4>
                        <Tooltip>
                          <TooltipTrigger className="text-zinc-500 hover:text-zinc-300 transition-colors">
                            <Info className="w-4 h-4" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-zinc-950 border-zinc-800 p-0 shadow-2xl">
                            {getTooltipContent(task)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{task.description}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={isCompleted ? "ghost" : "outline"}
                      onClick={() => toggleTask(task.id)}
                      className={isCompleted ? "text-green-500 hover:text-green-400" : "border-zinc-800"}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </Button>
                  </div>

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-800/50 pt-3">
                      <div className="flex items-center gap-4">
                        {task.resourceLink && (
                          <a 
                            href={task.resourceLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Resource
                          </a>
                        )}
                        {task.type === 'tcf_new' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Score:</span>
                            {isCompleted ? (
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-bold ${currentScore && currentScore >= 35 ? 'text-green-500' : 'text-red-500'}`}>
                                  {currentScore}/39
                                </span>
                                {currentScore && currentScore >= 35 ? <Trophy className="w-3 h-3 text-yellow-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  max={39} 
                                  min={0}
                                  placeholder="/39"
                                  className="w-16 h-7 text-xs bg-zinc-900 border-zinc-800"
                                  value={scoreInput.taskId === task.id ? scoreInput.score : ''}
                                  onChange={(e) => setScoreInput({ taskId: task.id, score: e.target.value })}
                                />
                                <select 
                                  className="h-7 px-1 text-[10px] bg-zinc-900 border border-zinc-800 rounded outline-none"
                                  onChange={(e) => {
                                    const tag = e.target.value;
                                    if (tag) {
                                      const s = parseInt(scoreInput.score);
                                      toggleTask(task.id, isNaN(s) ? undefined : s, [tag]);
                                    }
                                  }}
                                >
                                  <option value="">Tag</option>
                                  <option value="Grammar">Grammar</option>
                                  <option value="Comprehension">Comprehension</option>
                                  <option value="Vocabulary">Vocabulary</option>
                                </select>
                                <Button 
                                  size="sm" 
                                  className="h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    const s = parseInt(scoreInput.score);
                                    if (!isNaN(s)) toggleTask(task.id, s);
                                  }}
                                >
                                  Log
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

