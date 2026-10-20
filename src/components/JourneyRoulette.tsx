import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, RotateCw } from 'lucide-react';
import type { Couple, Journey, JourneyAssignment } from '../types';

const colors = ['#244b40', '#d9c69f', '#527466', '#eee4ce', '#31594c', '#c8ad76', '#718b7a', '#e2d6bd'];
const point = (angle: number, radius: number) => {
  const radians = angle * Math.PI / 180;
  return [200 + Math.cos(radians) * radius, 200 + Math.sin(radians) * radius] as const;
};

function sectorPath(index: number, count: number): string {
  if (count === 1) return 'M200 200 L200 25 A175 175 0 1 1 199.99 25 Z';
  const start = -90 + index * 360 / count;
  const end = -90 + (index + 1) * 360 / count;
  const [x1, y1] = point(start, 175);
  const [x2, y2] = point(end, 175);
  return `M200 200 L${x1} ${y1} A175 175 0 0 1 ${x2} ${y2} Z`;
}

function stopAngle(index: number, count: number): number {
  const center = -90 + (index + 0.5) * 360 / count;
  const aligned = ((-90 - center) % 360 + 360) % 360;
  return 360 * 5 + aligned;
}

interface Props {
  couple: Couple;
  journeys: Journey[];
  availableJourneys: Journey[];
  assignment?: JourneyAssignment;
  assignedJourney?: Journey;
  onDraw: () => string | null;
  onStart: () => void;
  reducedMotion: boolean;
  compatible: boolean;
  coupleCount: number;
  journeyCount: number;
}

export function JourneyRoulette({ couple, journeys, availableJourneys, assignment, assignedJourney, onDraw, onStart, reducedMotion, compatible, coupleCount, journeyCount }: Props) {
  const pool = useMemo(() => assignment
    ? assignment.poolIds.map(id => journeys.find(j => j.id === id)).filter((journey): journey is Journey => !!journey)
    : availableJourneys, [assignment, availableJourneys, journeys]);
  const resultIndex = assignment ? Math.max(0, pool.findIndex(j => j.id === assignment.journeyId)) : -1;
  const originalNumber = (journey: Journey) => journeys.findIndex(item => item.id === journey.id) + 1;
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(() => assignment ? stopAngle(resultIndex, Math.max(pool.length, 1)) : 0);
  const actionButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!spinning || reducedMotion) return;
    const timer = window.setTimeout(() => setSpinning(false), 3650);
    return () => window.clearTimeout(timer);
  }, [spinning, reducedMotion]);

  useEffect(() => {
    if (!spinning) actionButton.current?.focus();
  }, [assignment, spinning]);

  const spin = () => {
    if (spinning || assignment || !compatible) return;
    const sourcePool = availableJourneys;
    const selectedId = onDraw();
    if (!selectedId) return;
    const index = sourcePool.findIndex(j => j.id === selectedId);
    if (index < 0) return;
    setRotation(stopAngle(index, sourcePool.length));
    if (reducedMotion) setSpinning(false);
    else setSpinning(true);
  };

  return <section className="roulette-screen" aria-label="Sorteio da jornada temática">
    <div className="roulette-heading">
      <span className="eyebrow gold">UMA JORNADA PARA ESTE CASAL</span>
      <h2>{couple.partner1} <i>&</i> {couple.partner2}</h2>
      <p>A roleta vai revelar um caminho de partilha preparado para este encontro.</p>
    </div>
    {!compatible ? <div className="roulette-warning" role="alert">Há {coupleCount} casais cadastrados e {journeyCount} jornadas. Peça à organização para ajustar as listas antes de sortear.</div> : <div className="roulette-layout">
      <div className="wheel-column">
        <div className="wheel-wrap">
          <div className="wheel-pointer" aria-hidden="true"/>
          <svg className={`journey-wheel ${spinning ? 'spinning' : ''} ${reducedMotion ? 'no-wheel-motion' : ''}`} viewBox="0 0 400 400" role="img" aria-label={spinning ? 'Roleta girando; resultado ainda não revelado' : assignment && assignedJourney ? `Jornada sorteada: ${assignedJourney.title}` : `Roleta com ${pool.length} jornadas disponíveis`} style={{ transform: `rotate(${rotation}deg)` }}>
            <circle cx="200" cy="200" r="188" fill="#183c34"/>
            {pool.map((journey, index) => {
              const middle = -90 + (index + 0.5) * 360 / pool.length;
              const [tx, ty] = point(middle, pool.length <= 4 ? 120 : 126);
              return <g key={journey.id}>
                <path d={sectorPath(index, pool.length)} fill={colors[index % colors.length]} stroke="#fff8e9" strokeWidth="2"/>
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" className={`wheel-number ${index % 2 === 1 ? 'dark-number' : ''} ${!spinning && index === resultIndex ? 'winner-number' : ''}`}>{String(originalNumber(journey)).padStart(2, '0')}</text>
              </g>;
            })}
            <circle cx="200" cy="200" r="43" fill="#f8f3e7" stroke="#d5b778" strokeWidth="4"/>
            <text x="200" y="205" textAnchor="middle" className="wheel-center">ECC</text>
          </svg>
        </div>
        {spinning && <p className="spin-status" aria-live="polite">A jornada de vocês está sendo revelada…</p>}
        {assignment && assignedJourney && !spinning && <div className="draw-result" aria-live="polite"><span>JORNADA SORTEADA</span><h3>{assignedJourney.title}</h3><p>{assignedJourney.subtitle}</p></div>}
        {!assignment ? <button ref={actionButton} className="primary-button spin-button" onClick={spin} disabled={spinning || !compatible}><RotateCw size={19}/> Sortear nossa jornada</button> : spinning ? <button ref={actionButton} className="primary-button spin-button" disabled><RotateCw size={19}/> Sorteando nossa jornada…</button> : <button ref={actionButton} className="primary-button spin-button" onClick={onStart}><span>Iniciar nossa jornada</span><ChevronRight size={20}/></button>}
      </div>
      <ol className="journey-legend" aria-label="Jornadas desta dinâmica">{pool.map(journey => <li className={!spinning && journey.id === assignment?.journeyId ? 'legend-winner' : ''} key={journey.id}><span>{String(originalNumber(journey)).padStart(2, '0')}</span><div><strong>{journey.title}</strong><small>{journey.subtitle}</small></div></li>)}</ol>
    </div>}
    <p className="roulette-footnote">Cada jornada será sorteada uma única vez durante a dinâmica.</p>
  </section>;
}
