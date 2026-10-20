import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { appConfig } from './data/appConfig';
import { couples } from './data/couples';
import { journeys } from './data/journeys';
import type { Progress } from './types';
import { emptyProgress } from './services/storage';

function saveState(progress: Progress) { localStorage.setItem(appConfig.storageKey, JSON.stringify(progress)); }
function assignedState(coupleId = couples[0]!.id, journeyId = journeys[0]!.id): Progress {
  const state = emptyProgress(couples);
  state.activeId = coupleId;
  state.stage = 'ROULETTE';
  state.assignments[coupleId] = { coupleId, journeyId, poolIds: journeys.map(j => j.id) };
  return state;
}

describe('roleta e jornadas', () => {
  beforeEach(() => { localStorage.clear(); vi.useRealTimers(); });

  it('sorteia uma jornada disponível uma vez e completa o fluxo', async () => {
    vi.useFakeTimers();
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Ana Alice.*Nairon/i }));
    expect(screen.getByRole('button', { name: /Sortear nossa jornada/i })).toBeInTheDocument();
    const spin = screen.getByRole('button', { name: /Sortear nossa jornada/i });
    fireEvent.click(spin);
    fireEvent.click(spin);
    let stored = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    expect(Object.keys(stored.assignments)).toEqual(['pedro-teresa']);
    expect(screen.getByRole('button', { name: /Sorteando nossa jornada/i })).toBeDisabled();
    expect(document.querySelector('.journey-wheel')?.getAttribute('aria-label')).toMatch(/resultado ainda/i);
    expect(document.querySelectorAll('.wheel-number.winner-number')).toHaveLength(0);
    expect(document.querySelectorAll('.journey-legend .legend-winner')).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(3700); });
    expect(document.querySelectorAll('.wheel-number.winner-number')).toHaveLength(1);
    expect(document.querySelectorAll('.journey-legend .legend-winner')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar nossa jornada/i }));
    expect(screen.getByText(new RegExp(journeys.find(j => j.id === stored.assignments['pedro-teresa'].journeyId)!.title))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Iniciar nossa partilha/i }));
    expect(screen.getByText(/ANA ALICE RESPONDE PARA NAIRON/i)).toBeInTheDocument();
    expect(screen.getByText(/NAIRON RESPONDE PARA ANA ALICE/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar nossa caminhada/i }));
    expect(screen.getByText(/Paráfrase inspirada/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Assumir nosso propósito/i }));
    fireEvent.click(screen.getByRole('button', { name: /Concluir e voltar/i }));
    stored = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    expect(stored.completedIds).toContain('pedro-teresa');
    expect(stored.assignments['pedro-teresa']).toBeDefined();
    expect(screen.queryByRole('button', { name: /Ana Alice.*Nairon/i })).not.toBeInTheDocument();
  });

  it('permite selecionar o casal e girar com Enter', async () => {
    const user = userEvent.setup();
    render(<App/>);
    const coupleButton = screen.getByRole('button', { name: /Laice.*Izael/i });
    coupleButton.focus();
    await user.keyboard('{Enter}');
    const spinButton = screen.getByRole('button', { name: /Sortear nossa jornada/i });
    expect(document.activeElement).toBe(spinButton);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /Sorteando nossa jornada/i })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}').assignments['larissa-pablo']).toBeDefined();
  });

  it('voltar da roleta antes do sorteio não cria nem libera atribuição', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Ana Alice.*Nairon/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    const state = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    expect(state.assignments).toEqual({});
    expect(screen.getByRole('button', { name: /Ana Alice.*Nairon/i })).toBeInTheDocument();
  });

  it('mantém uma jornada atribuída ao voltar para a tela inicial', () => {
    saveState(assignedState());
    render(<App/>);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}').assignments['pedro-teresa'].journeyId).toBe(journeys[0]!.id);
    expect(screen.queryByRole('button', { name: /Ana Alice.*Nairon/i })).not.toBeInTheDocument();
  });

  it('persiste a atribuição ao atualizar e não oferece a jornada novamente', () => {
    const state = assignedState();
    saveState(state);
    const first = render(<App/>);
    expect(screen.getAllByText(journeys[0]!.title).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Iniciar nossa jornada/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ana Alice.*Nairon/i })).not.toBeInTheDocument();
    first.unmount();
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Organização/i }));
    expect(screen.getAllByText(journeys[0]!.title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Em andamento/i).length).toBe(1);
  });

  it('não repete jornadas em sorteios sucessivos', () => {
    const first = assignedState('pedro-teresa', 'experiencia-ecc');
    const secondCoupleId = 'larissa-pablo';
    first.activeId = null;
    first.stage = 'HOME';
    first.assignments['larissa-pablo'] = { coupleId: secondCoupleId, journeyId: 'reencontro-cristo', poolIds: journeys.filter(j => j.id !== 'experiencia-ecc').map(j => j.id) };
    saveState(first);
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Myriam.*Iagor/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sortear nossa jornada/i }));
    const stored = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    const journeyIds = Object.values(stored.assignments as Record<string, { journeyId: string }>).map(a => a.journeyId);
    expect(new Set(journeyIds).size).toBe(journeyIds.length);
  });

  it('retoma participação restaurada mantendo a jornada atribuída', () => {
    const state = assignedState();
    state.completedIds = ['pedro-teresa'];
    state.activeId = null;
    state.stage = 'HOME';
    saveState(state);
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Organização/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}').assignments['pedro-teresa'].journeyId).toBe(journeys[0]!.id);
    fireEvent.click(screen.getByRole('button', { name: /Retomar/i }));
    expect(screen.getByRole('button', { name: /Iniciar nossa partilha/i })).toBeInTheDocument();
  });

  it('mantem a numeracao original das jornadas disponiveis apos um sorteio', () => {
    const state = assignedState('pedro-teresa', journeys[4]!.id);
    state.activeId = null;
    state.stage = 'HOME';
    saveState(state);
    render(<App/>);

    fireEvent.click(screen.getByRole('button', { name: /Laice.*Izael/i }));

    const expectedNumbers = ['01', '02', '03', '04', '06', '07', '08'];
    const wheelNumbers = Array.from(document.querySelectorAll('.wheel-number')).map(node => node.textContent);
    const legendNumbers = Array.from(document.querySelectorAll('.journey-legend li > span')).map(node => node.textContent);
    expect(wheelNumbers).toEqual(expectedNumbers);
    expect(legendNumbers).toEqual(expectedNumbers);
  });

  it('usa os nomes do casal ativo com qualquer jornada sorteada', () => {
    const state = assignedState('larissa-pablo', 'reencontro-cristo');
    state.stage = 'QUESTIONS';
    saveState(state);
    render(<App/>);
    expect(screen.getByText(/LAICE RESPONDE PARA IZAEL/i)).toBeInTheDocument();
    expect(screen.getByText(/IZAEL RESPONDE PARA LAICE/i)).toBeInTheDocument();
    expect(screen.getByText(/Em qual momento simples da nossa rotina/i)).toBeInTheDocument();
  });

  it('cancela atribuição com confirmação e libera a jornada', () => {
    saveState(assignedState());
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Organização/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Cancelar atribuição/i })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirmar' })[0]!);
    const state = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    expect(state.assignments['pedro-teresa']).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.getByRole('button', { name: /Ana Alice.*Nairon/i })).toBeInTheDocument();
  });

  it('reinicia após confirmação e limpa atribuições e conclusões', () => {
    const state = assignedState();
    state.completedIds = ['pedro-teresa'];
    saveState(state);
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Organização/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar dinâmica/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sim, reiniciar a dinâmica/i }));
    const reset = JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}');
    expect(reset.assignments).toEqual({});
    expect(reset.completedIds).toEqual([]);
  });

  it('pede confirmação para o estado legado e mantém uma cópia antes de iniciar', () => {
    const legacy = JSON.stringify({ completedIds: ['pedro-teresa'], activeId: 'larissa-pablo', stage: 'QUESTIONS', order: couples.map(c => c.id) });
    localStorage.setItem(appConfig.storageKey, legacy);
    render(<App/>);
    expect(screen.getByRole('dialog', { name: /Nova dinâmica de jornadas/i })).toBeInTheDocument();
    expect(localStorage.getItem(appConfig.storageKey)).toBe(legacy);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e iniciar no novo formato/i }));
    expect(localStorage.getItem(`${appConfig.storageKey}-legacy-backup`)).toBe(legacy);
    expect(JSON.parse(localStorage.getItem(appConfig.storageKey) ?? '{}').version).toBe(2);
  });

  it('mostra a celebração coletiva ao concluir todos os casais', () => {
    const state = emptyProgress(couples);
    state.completedIds = couples.map(c => c.id);
    state.assignments = Object.fromEntries(couples.map((c, i) => [c.id, { coupleId: c.id, journeyId: journeys[i]!.id, poolIds: journeys.slice(i).map(j => j.id) }]));
    saveState(state);
    render(<App/>);
    expect(screen.getByText(/O Encontro termina. A missão continua./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar ao início/i })).toBeInTheDocument();
  });
});
