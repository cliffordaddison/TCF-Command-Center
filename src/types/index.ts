export type TaskType = 'A Moi Paris' | 'Test' | 'Production' | 'Review' | 'Emergency';
export type SkillType = 'listening' | 'reading' | 'speaking' | 'writing' | 'general';
export type TaskStatus = 'backlog' | 'today' | 'in_progress' | 'done' | 'archived';

export interface UserProfile {
  uid: string;
  startDate: string;
  targetExamDate: string;
  currentLevel: string;
  dailyMinutesTarget: number;
  timezone: string;
  emergencyMode: boolean;
  streaks: {
    current: number;
    longest: number;
    lastCompletedDate: string | null;
  };
  skillScores: {
    listening: number;
    reading: number;
    speaking: number;
    writing: number;
    overall: number;
  };
  monthlyGates: Record<string, { target: number; current: number; label: string }>;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  expectedOutcome: string;
  toolLink: string;
  type: TaskType;
  skill: SkillType;
  duration: number;
  scheduledDate: string;
  status: TaskStatus;
  sequence: number;
  dependencies: string[];
  attemptNumber: number;
  requiredScore: number;
  pipelineStatus?: 'take_1' | 'take_2' | 'take_3';
  objective: string;
  steps: { text: string; completed: boolean }[];
  resources: {
    amoiparisLevel?: string;
    audioUrl?: string;
    testUrl?: string;
    templateId?: string;
    links?: { label: string; url: string }[];
  };
  successCriteria: string;
  nextCard?: string;
}

export interface Log {
  id: string;
  userId: string;
  taskId: string;
  completedAt: string;
  durationActual: number;
  score: number;
  notes: string;
  nextTaskId?: string;
}
