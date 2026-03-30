// Family Types
export interface Family {
  id: string;
  pseudonym: string;
  location: string;
  familyComposition: {
    adults: number;
    children: number;
    elderly: number;
  };
  background: string;
  currentSituation: string;
  keyChallenges: string[];
  highlights: InteractionHighlight[];
  photos: Photo[];
  consentGiven: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InteractionHighlight {
  date: string;
  title: string;
  description: string;
  photos?: string[];
}

export interface Photo {
  url: string;
  caption: string;
  consentGiven: boolean;
}

// Schedule Types
export type EventType = 'field_trip' | 'visit' | 'event' | 'meeting';

export interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  duration: string;
  location: string;
  description: string;
  familiesInvolved?: string[];
  maxParticipants?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Plan Types
export type FocusArea = 'mental_health' | 'companionship' | 'social_integration';
export type PlanStatus = 'active' | 'completed' | 'on_hold';

export interface SupportPlan {
  id: string;
  familyId: string;
  title: string;
  focusArea: FocusArea;
  status: PlanStatus;
  startDate: string;
  targetEndDate?: string;
  objectives: Objective[];
  activities: PlannedActivity[];
  ethicsDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  description: string;
  successIndicator: string;
  status: 'pending' | 'in_progress' | 'achieved';
}

export interface PlannedActivity {
  id: string;
  title: string;
  description: string;
  frequency: string;
  status: 'planned' | 'completed' | 'cancelled';
}

// AI Assistant Types
export interface AIResponse {
  greeting: string;
  mainAdvice: string[];
  activitySuggestions?: string[];
  resources?: string[];
  closing: string;
}

// Data store types
export interface FamiliesData {
  families: Family[];
}

export interface ScheduleData {
  events: ScheduleEvent[];
}

export interface PlansData {
  plans: SupportPlan[];
}
