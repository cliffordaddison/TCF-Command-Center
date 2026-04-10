export interface UserProfile {
  uid: string;
  email: string;
  settings?: {
    notificationHour: number;
  };
  startDate: string;
  targetExamDate: string;
}

export type TaskType = 'story' | 'tcf_new' | 'tcf_review' | 'tcf_drill' | 'general';

export interface TaskTemplate {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  resourceLink?: string;
  testId?: number; // For TCF tests
}

export interface StudyPlanDay {
  day: number;
  dateOffset: number;
  tasks: TaskTemplate[];
}

export interface TCFTestResult {
  testId: number;
  attemptNumber: number;
  score: number; // out of 39
  weakTags: string[];
  date: string;
}

export interface UserProgressTask {
  id: string;
  completed: boolean;
  timeSpent: number;
  score?: number; // For TCF tests
  weakTags?: string[];
}

export interface UserProgress {
  userId: string;
  dayNumber: number;
  tasks: UserProgressTask[];
  dateCompleted: string;
  tcfResults?: TCFTestResult[];
}
