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
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  familiesInvolved?: string[];
  maxParticipants?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Plan Types
export type FocusArea = 'social' | 'financial' | 'academic';
export type PlanStatus = 'active' | 'completed' | 'on_hold';

export interface SupportPlan {
  id: string;
  familyIds: string[];
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

// Team Member Types
export type MemberRole = 'lead' | 'coordinator' | 'volunteer';
export type MemberStatus = 'active' | 'inactive';

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  email: string;
  phone: string;
  status: MemberStatus;
  /** Families this member is responsible for */
  assignedFamilyIds: string[];
  joinedDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Activity Record Types — a recorded session (what actually happened)
export interface ActivityRecord {
  id: string;
  /** Optional link to the planned ScheduleEvent this record documents */
  eventId?: string;
  title: string;
  type: EventType;
  date: string;
  /** Families that took part */
  familyIds: string[];
  /** Team members who attended */
  memberIds: string[];
  /** What happened during the session */
  summary: string;
  /** Impact / results observed */
  outcomes: string;
  /** Next steps / things to follow up on */
  followUps: string;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
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
