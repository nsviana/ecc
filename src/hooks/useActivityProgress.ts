import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Couple, Journey, JourneyAssignment, Progress, Stage } from '../types';
import { archiveLegacyAndStart, emptyProgress, loadProgress, saveProgress, uniformRandomIndex } from '../services/storage';

export function useActivityProgress(couples: Couple[], journeys: Journey[]) {
  const [initial] = useState(() => loadProgress(couples, journeys));
  const [progress, setProgress] = useState(initial.kind === 'ready' ? initial.progress : emptyProgress(couples));
  const progressRef = useRef(progress);
  const [legacyRaw, setLegacyRaw] = useState(initial.kind === 'legacy' ? initial.raw : null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const commit = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  useEffect(() => {
    if (legacyRaw === null) saveProgress(progress);
  }, [legacyRaw, progress]);

  const available = useMemo(() => progress.order
    .map(id => couples.find(c => c.id === id))
    .filter((c): c is Couple => !!c && !progress.completedIds.includes(c.id) && !progress.assignments[c.id]), [couples, progress]);
  const availableJourneys = useMemo(() => journeys.filter(j => !Object.values(progress.assignments).some(a => a.journeyId === j.id)), [journeys, progress]);
  const active = couples.find(c => c.id === progress.activeId);
  const activeJourney = active ? journeys.find(j => j.id === progress.assignments[active.id]?.journeyId) : undefined;
  const isConfigurationCompatible = couples.length === journeys.length;

  const startNewFormat = useCallback(() => {
    const fresh = emptyProgress(couples);
    if (legacyRaw !== null && !archiveLegacyAndStart(legacyRaw, fresh)) return false;
    if (legacyRaw === null && !saveProgress(fresh)) return false;
    progressRef.current = fresh;
    setProgress(fresh);
    setLegacyRaw(null);
    return true;
  }, [couples, legacyRaw]);

  const select = useCallback((id: string) => {
    const current = progressRef.current;
    if (legacyRaw !== null || !available.some(c => c.id === id) || current.activeId) return;
    commit({ ...current, activeId: id, stage: 'ROULETTE' });
  }, [available, commit, legacyRaw]);

  const draw = useCallback((): string | null => {
    if (legacyRaw !== null || !isConfigurationCompatible) return null;
    const current = progressRef.current;
    const coupleId = current.activeId;
    if (!coupleId || current.assignments[coupleId] || current.completedIds.includes(coupleId)) return null;
    const pool = journeys.filter(j => !Object.values(current.assignments).some(a => a.journeyId === j.id));
    if (pool.length === 0) return null;
    const journey = pool[uniformRandomIndex(pool.length)]!;
    const assignment: JourneyAssignment = { coupleId, journeyId: journey.id, poolIds: pool.map(j => j.id) };
    commit({ ...current, assignments: { ...current.assignments, [coupleId]: assignment }, stage: 'ROULETTE' });
    return journey.id;
  }, [commit, isConfigurationCompatible, journeys, legacyRaw]);

  const setStage = useCallback((stage: Stage) => {
    const current = progressRef.current;
    if (!current.activeId || legacyRaw !== null) return;
    if (stage !== 'ROULETTE' && stage !== 'HOME' && !current.assignments[current.activeId]) return;
    commit({ ...current, stage });
  }, [commit, legacyRaw]);

  const back = useCallback(() => {
    const current = progressRef.current;
    const previous: Partial<Record<Stage, Stage>> = {
      ROULETTE: 'HOME', INTRODUCTION: 'ROULETTE', QUESTIONS: 'INTRODUCTION',
      BIBLE_REFLECTION: 'QUESTIONS', PURPOSE: 'BIBLE_REFLECTION',
    };
    const stage = previous[current.stage] ?? 'HOME';
    commit({ ...current, stage, activeId: current.stage === 'ROULETTE' ? null : current.activeId });
  }, [commit]);

  const home = useCallback(() => {
    const current = progressRef.current;
    commit({ ...current, activeId: null, stage: 'HOME' });
  }, [commit]);
  const finish = useCallback(() => {
    const current = progressRef.current;
    if (!current.activeId || !current.assignments[current.activeId]) return;
    commit({ ...current, completedIds: [...new Set([...current.completedIds, current.activeId])], activeId: null, stage: 'HOME' });
  }, [commit]);
  const restore = useCallback((id: string) => {
    const current = progressRef.current;
    if (!current.assignments[id]) return;
    commit({ ...current, completedIds: current.completedIds.filter(value => value !== id) });
  }, [commit]);
  const cancelAssignment = useCallback((id: string) => {
    const current = progressRef.current;
    if (!current.assignments[id]) return;
    const assignments = { ...current.assignments };
    delete assignments[id];
    commit({ ...current, assignments, completedIds: current.completedIds.filter(value => value !== id), activeId: current.activeId === id ? null : current.activeId, stage: current.activeId === id ? 'HOME' : current.stage });
  }, [commit]);
  const resume = useCallback((id: string) => {
    const current = progressRef.current;
    if (!current.assignments[id] || current.completedIds.includes(id)) return;
    commit({ ...current, activeId: id, stage: 'INTRODUCTION' });
  }, [commit]);
  const reset = useCallback(() => commit(emptyProgress(couples)), [commit, couples]);
  const shuffle = useCallback(() => {
    const current = progressRef.current;
    const order = [...current.order];
    for (let i = order.length - 1; i > 0; i--) {
      const j = uniformRandomIndex(i + 1);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    commit({ ...current, order });
  }, [commit]);
  const toggleMotion = useCallback(() => setReducedMotion(value => !value), []);

  return {
    progress, available, availableJourneys, active, activeJourney,
    select, draw, setStage, back, finish, restore, cancelAssignment, resume, reset, shuffle,
    reducedMotion, toggleMotion, home, migrationRequired: legacyRaw !== null, startNewFormat,
    isConfigurationCompatible,
  };
}
