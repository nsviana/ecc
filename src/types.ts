export interface BibleReflection {
  references: string[];
  text: string;
  textType: 'paraphrase' | 'quotation';
  translation?: string;
  source?: string;
  reflection: string;
}

export interface Couple {
  id: string;
  partner1: string;
  partner2: string;
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  introduction: string;
  questions: { forPartner1: string; forPartner2: string };
  bible: BibleReflection;
  purpose: string;
}

export type Stage = 'HOME' | 'ROULETTE' | 'INTRODUCTION' | 'QUESTIONS' | 'BIBLE_REFLECTION' | 'PURPOSE' | 'FINAL_CELEBRATION';
export interface JourneyAssignment { coupleId: string; journeyId: string; poolIds: string[]; }
export interface Progress {
  version: 2;
  completedIds: string[];
  activeId: string | null;
  stage: Stage;
  order: string[];
  assignments: Record<string, JourneyAssignment>;
}
