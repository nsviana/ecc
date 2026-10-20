import type { Couple, Journey, JourneyAssignment, Progress, Stage } from '../types';
import { appConfig } from '../data/appConfig';

export const PROGRESS_VERSION = 2 as const;
const stages: Stage[] = ['HOME', 'ROULETTE', 'INTRODUCTION', 'QUESTIONS', 'BIBLE_REFLECTION', 'PURPOSE', 'FINAL_CELEBRATION'];

export type LoadedProgress =
  | { kind: 'ready'; progress: Progress }
  | { kind: 'legacy'; raw: string };

export const emptyProgress = (couples: Couple[]): Progress => ({
  version: PROGRESS_VERSION,
  completedIds: [],
  activeId: null,
  stage: 'HOME',
  order: couples.map(c => c.id),
  assignments: {},
});

export function sanitizeProgress(data: unknown, couples: Couple[], journeys: Journey[]): Progress {
  const fallback = emptyProgress(couples);
  if (!data || typeof data !== 'object' || (data as { version?: unknown }).version !== PROGRESS_VERSION) return fallback;

  const value = data as Partial<Progress>;
  const coupleIds = new Set(couples.map(c => c.id));
  const journeyIds = new Set(journeys.map(j => j.id));
  const assignments: Record<string, JourneyAssignment> = {};
  const usedJourneys = new Set<string>();

  if (value.assignments && typeof value.assignments === 'object') {
    for (const [coupleId, raw] of Object.entries(value.assignments)) {
      if (!coupleIds.has(coupleId) || !raw || typeof raw !== 'object') continue;
      const assignment = raw as JourneyAssignment;
      if (assignment.coupleId !== coupleId || !journeyIds.has(assignment.journeyId) || usedJourneys.has(assignment.journeyId)) continue;
      const poolIds = Array.isArray(assignment.poolIds)
        ? [...new Set(assignment.poolIds.filter((id): id is string => typeof id === 'string' && journeyIds.has(id)))]
        : [];
      if (poolIds.length === 0 || !poolIds.includes(assignment.journeyId)) poolIds.push(assignment.journeyId);
      assignments[coupleId] = { coupleId, journeyId: assignment.journeyId, poolIds };
      usedJourneys.add(assignment.journeyId);
    }
  }

  const completedIds = Array.isArray(value.completedIds)
    ? [...new Set(value.completedIds.filter((id): id is string => typeof id === 'string' && coupleIds.has(id) && !!assignments[id]))]
    : [];
  const activeId = typeof value.activeId === 'string' && coupleIds.has(value.activeId) && !completedIds.includes(value.activeId) ? value.activeId : null;
  const order = Array.isArray(value.order)
    ? [...new Set(value.order.filter((id): id is string => typeof id === 'string' && coupleIds.has(id))), ...couples.map(c => c.id).filter(id => !value.order?.includes(id))]
    : fallback.order;
  let stage: Stage = activeId && stages.includes(value.stage as Stage) ? value.stage as Stage : 'HOME';
  if (activeId && (stage === 'HOME' || stage === 'FINAL_CELEBRATION' || !assignments[activeId])) stage = 'ROULETTE';
  if (!activeId) stage = 'HOME';

  return { version: PROGRESS_VERSION, completedIds, activeId, stage, order, assignments };
}

export function loadProgress(couples: Couple[], journeys: Journey[]): LoadedProgress {
  try {
    const raw = localStorage.getItem(appConfig.storageKey);
    if (raw === null) return { kind: 'ready', progress: emptyProgress(couples) };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed as { version?: unknown }).version === PROGRESS_VERSION) {
      return { kind: 'ready', progress: sanitizeProgress(parsed, couples, journeys) };
    }
    return { kind: 'legacy', raw };
  } catch {
    // Preserve malformed or unreadable data until an organizer confirms the migration.
    try {
      const raw = localStorage.getItem(appConfig.storageKey);
      return raw === null ? { kind: 'ready', progress: emptyProgress(couples) } : { kind: 'legacy', raw };
    } catch {
      return { kind: 'ready', progress: emptyProgress(couples) };
    }
  }
}

export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(appConfig.storageKey, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function archiveLegacyAndStart(raw: string, progress: Progress): boolean {
  try {
    const base = `${appConfig.storageKey}-legacy-backup`;
    let archiveKey = base;
    let suffix = 1;
    while (localStorage.getItem(archiveKey) !== null) archiveKey = `${base}-${suffix++}`;
    localStorage.setItem(archiveKey, raw);
    localStorage.setItem(appConfig.storageKey, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function uniformRandomIndex(length: number, fill: (array: Uint32Array) => Uint32Array = array => crypto.getRandomValues(array)): number {
  if (!Number.isInteger(length) || length < 1) throw new RangeError('A jornada precisa ter opções disponíveis.');
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / length) * length;
  const value = new Uint32Array(1);
  do { fill(value); } while (value[0]! >= limit);
  return value[0]! % length;
}
