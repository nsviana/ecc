import { beforeEach, describe, expect, it } from 'vitest';
import { appConfig } from '../data/appConfig';
import { couples } from '../data/couples';
import { journeys } from '../data/journeys';
import { emptyProgress, loadProgress, sanitizeProgress, uniformRandomIndex } from './storage';

describe('armazenamento e sorteio', () => {
  beforeEach(() => localStorage.clear());

  it('usa amostragem sem viés de módulo ao escolher uma jornada', () => {
    const values = [0xffff_ffff, 0xffff_fffe];
    const result = uniformRandomIndex(3, array => { array[0] = values.shift() ?? 0; return array; });
    expect(result).toBe(2);
    expect(() => uniformRandomIndex(0)).toThrow(RangeError);
  });

  it('preserva o estado antigo sem gravar até a confirmação do organizador', () => {
    const legacy = JSON.stringify({ completedIds: ['pedro-teresa'], activeId: 'larissa-pablo', stage: 'QUESTIONS' });
    localStorage.setItem(appConfig.storageKey, legacy);
    expect(loadProgress(couples, journeys)).toEqual({ kind: 'legacy', raw: legacy });
    expect(localStorage.getItem(appConfig.storageKey)).toBe(legacy);
  });

  it('descarta atribuições duplicadas ou com IDs inválidos na leitura do formato novo', () => {
    const base = emptyProgress(couples);
    base.assignments = {
      'pedro-teresa': { coupleId: 'pedro-teresa', journeyId: journeys[0]!.id, poolIds: [journeys[0]!.id] },
      'larissa-pablo': { coupleId: 'larissa-pablo', journeyId: journeys[0]!.id, poolIds: [journeys[0]!.id] },
      'carlos-ana': { coupleId: 'carlos-ana', journeyId: 'missing-journey', poolIds: ['missing-journey'] },
      'missing-couple': { coupleId: 'missing-couple', journeyId: journeys[1]!.id, poolIds: [journeys[1]!.id] },
    };
    const sanitized = sanitizeProgress(base, couples, journeys);
    expect(Object.keys(sanitized.assignments)).toEqual(['pedro-teresa']);
    expect(new Set(Object.values(sanitized.assignments).map(item => item.journeyId)).size).toBe(1);
  });
});
