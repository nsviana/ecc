import { useState } from 'react';
import { BookHeart, ChevronLeft, ChevronRight, Church, Heart, Maximize, RotateCcw, Shuffle, Sparkles, Users, X } from 'lucide-react';
import { JourneyRoulette } from './components/JourneyRoulette';
import { appConfig } from './data/appConfig';
import { couples } from './data/couples';
import { journeys } from './data/journeys';
import { useActivityProgress } from './hooks/useActivityProgress';
import { useRemoteNavigation } from './hooks/useRemoteNavigation';
import type { Couple } from './types';

function ImageOrnament({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`image-ornament ${className}`} aria-label={alt}>{!failed && <img src={src} alt={alt} onError={() => setFailed(true)} />}{failed && <div className="image-fallback"><span className="halo"/><Church size={40}/><span>Sagrada Família</span></div>}</div>;
}

function CoupleSidebar({ list, activeId, onSelect, onAdmin }: { list: Couple[]; activeId: string | null; onSelect: (id: string) => void; onAdmin: () => void }) {
  return <aside className="sidebar"><div className="sidebar-heading"><span className="eyebrow">CAMINHAMOS JUNTOS</span><h2>Casais</h2><span className="side-rule"/></div><nav className="couple-list" aria-label="Casais participantes">{list.map((couple, index) => <button key={couple.id} disabled={activeId !== null} className={`couple-button ${activeId === couple.id ? 'selected' : ''}`} onClick={() => onSelect(couple.id)}><span className="couple-number">{String(index + 1).padStart(2, '0')}</span><span>{couple.partner1} <i>&</i> {couple.partner2}</span><ChevronRight size={17}/></button>)}{list.length === 0 && <p className="all-done-note">Todos os casais já sortearam sua jornada.</p>}</nav><button className="admin-link" onClick={onAdmin}><span className="tiny-cross">✦</span> Organização</button></aside>;
}

function App() {
  const flow = useActivityProgress(couples, journeys);
  const { progress, available, availableJourneys, active, activeJourney } = flow;
  const [admin, setAdmin] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [migrationError, setMigrationError] = useState('');
  const allDone = progress.completedIds.length === couples.length;
  const visibleStage = allDone && !celebrationDismissed ? 'FINAL_CELEBRATION' : progress.stage;
  useRemoteNavigation(flow.back);

  const fullscreen = () => { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); };

  return <div className={`app-shell ${flow.reducedMotion ? 'reduced-motion' : ''}`}>
    <header className="topbar"><div className="brand-mark"><span>✝</span></div><div className="brand-copy"><div className="brand-name">ENCONTRO DE CASAIS COM CRISTO <span>· ECC</span></div><h1>{appConfig.title}</h1><p>{appConfig.subtitle}</p></div><div className="meeting-pill"><span className="meeting-dot"/>{appConfig.meeting}</div></header>
    <div className="main-layout">
      <CoupleSidebar list={available} activeId={progress.activeId} onSelect={flow.select} onAdmin={() => setAdmin(true)}/>
      <main className="content-area">
        {visibleStage === 'HOME' && <section className="welcome-stage" key="home"><div className="welcome-copy"><span className="eyebrow gold">{allDone ? 'NOSSA CAMINHADA NESTE ENCONTRO' : appConfig.theme.toUpperCase()}</span><h2>{allDone ? <>A semente foi lançada.<br/><em>Que o amor continue florescendo.</em></> : <>Do Encontro<br/><em>à Missão</em></>}</h2>{allDone ? <div className="welcome-message"><p>Todos os casais participaram.</p><p>Que os propósitos assumidos deem frutos de cuidado, serviço e evangelização na vida de cada família.</p></div> : <div className="welcome-message">{appConfig.welcome.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}<div className="welcome-prompt"><span className="prompt-icon"><Users size={19}/></span><span>{allDone ? 'Dinâmica concluída' : appConfig.participationInstruction}<br/><small>{allDone ? 'A equipe pode rever o progresso em Organização' : `${available.length} ${available.length === 1 ? 'casal aguarda' : 'casais aguardam'} este momento`}</small></span></div><div className="scripture-ribbon"><span>{appConfig.subtitle}</span><small>{appConfig.theme}</small></div></div><div className="welcome-art"><ImageOrnament src={appConfig.images.holyFamily} alt="Sagrada Família"/><div className="art-caption"><span>NAZARÉ</span><i/> <span>AMOR · FÉ · MISSÃO</span></div></div><div className="decorative-star star-a">✦</div><div className="decorative-star star-b">✧</div></section>}

        {visibleStage === 'ROULETTE' && active && <JourneyRoulette key={active.id} couple={active} journeys={journeys} availableJourneys={availableJourneys} assignment={progress.assignments[active.id]} assignedJourney={activeJourney} onDraw={flow.draw} onStart={() => flow.setStage('INTRODUCTION')} reducedMotion={flow.reducedMotion} compatible={flow.isConfigurationCompatible} coupleCount={couples.length} journeyCount={journeys.length}/>}

        {visibleStage === 'INTRODUCTION' && active && activeJourney && <section className="experience-stage" key={`${active.id}-intro`}><ProgressBar index={0} onBack={flow.back}/><div className="experience-inner"><div className="stage-symbol"><Heart size={28}/></div><span className="eyebrow gold">JORNADA DE {active.partner1.toUpperCase()} & {active.partner2.toUpperCase()}</span><h2>{activeJourney.title}</h2><h3>{activeJourney.subtitle}</h3><p className="intro-message">{activeJourney.introduction}</p><button className="primary-button" onClick={() => flow.setStage('QUESTIONS')}>Iniciar nossa partilha <ChevronRight size={20}/></button></div><div className="stage-foot">UM TEMPO DE ESCUTA, GRATIDÃO E ENCONTRO</div></section>}

        {visibleStage === 'QUESTIONS' && active && activeJourney && <section className="experience-stage question-stage" key={`${active.id}-questions`}><ProgressBar index={1} onBack={flow.back}/><div className="question-content"><span className="eyebrow gold">{activeJourney.title.toUpperCase()}</span><h2>Recordar para seguir em missão.</h2><p className="question-instruction">{appConfig.questionInstruction}</p><div className="question-cards"><QuestionCard name={active.partner1} other={active.partner2} text={activeJourney.questions.forPartner1}/><QuestionCard name={active.partner2} other={active.partner1} text={activeJourney.questions.forPartner2}/></div><button className="primary-button" onClick={() => flow.setStage('BIBLE_REFLECTION')}>Continuar nossa caminhada <ChevronRight size={20}/></button><p className="pass-note">Partilhem no tempo de vocês. Se preferirem, podem passar uma pergunta.</p></div></section>}

        {visibleStage === 'BIBLE_REFLECTION' && active && activeJourney && <section className="experience-stage bible-stage" key={`${active.id}-bible`}><ProgressBar index={2} onBack={flow.back}/><div className="bible-content"><div className="bible-icon"><BookHeart size={24}/></div><span className="eyebrow gold">A PALAVRA ILUMINA A CAMINHADA</span><p className="reference">{activeJourney.bible.references.join(' · ')}</p><blockquote>{activeJourney.bible.text}<small>Paráfrase inspirada na passagem bíblica</small></blockquote><p className="bible-reflection">{activeJourney.bible.reflection}</p><div className="bible-application"><span>PARA A VIDA A DOIS</span><p>Que gesto simples pode tornar esta Palavra visível na casa e na comunidade de vocês?</p></div><button className="primary-button" onClick={() => flow.setStage('PURPOSE')}>Assumir nosso propósito <ChevronRight size={20}/></button></div></section>}

        {visibleStage === 'PURPOSE' && active && activeJourney && <section className="experience-stage purpose-stage" key={`${active.id}-purpose`}><ProgressBar index={3} onBack={flow.back}/><div className="purpose-content"><div className="stage-symbol"><Sparkles size={27}/></div><span className="eyebrow gold">UM PASSO CONCRETO</span><h2>Nosso compromisso a partir de hoje</h2><div className="purpose-card"><span className="quote-mark">“</span>{activeJourney.purpose}</div><div className="closing-blessing">Que Cristo fortaleça este propósito e faça florescer, em vocês, frutos de paz e alegria.</div><button className="primary-button" onClick={flow.finish}>Concluir e voltar ao encontro <Heart size={18}/></button></div></section>}

        {visibleStage === 'FINAL_CELEBRATION' && <FinalScreen onHome={() => { setCelebrationDismissed(true); flow.home(); }}/>}
        <footer className="content-footer"><span>✦</span> SAGRADA FAMÍLIA DE NAZARÉ, ROGAI POR NÓS <span>✦</span></footer>
      </main>
    </div>
    <div className="bottom-actions"><button onClick={fullscreen} aria-label="Ativar tela cheia"><Maximize size={17}/><span>Tela cheia</span></button><span className="key-hint">NAVEGUE COM AS SETAS <b>↑ ↓ ← →</b> E CONFIRME COM <b>ENTER</b></span><span className="refs">Mt 28 · Gl 3 · Jo 13 · Jo 15</span></div>

    {admin && <AdminPanel flow={flow} onClose={() => { setAdmin(false); setConfirmReset(false); setConfirmCancel(null); }} confirmReset={confirmReset} setConfirmReset={setConfirmReset} confirmCancel={confirmCancel} setConfirmCancel={setConfirmCancel}/>}
    {flow.migrationRequired && <div className="modal-backdrop migration-backdrop"><section className="admin-modal migration-modal" role="dialog" aria-modal="true" aria-labelledby="migration-title"><span className="eyebrow gold">CONFIRMAÇÃO DA ORGANIZAÇÃO</span><h2 id="migration-title">Nova dinâmica de jornadas</h2><p>Encontramos progresso salvo no formato anterior. Esse formato não registra jornadas sorteadas, então não é possível recuperar com segurança uma atribuição para a participação em andamento.</p><p>Ao confirmar, o progresso antigo será arquivado neste dispositivo e uma nova dinâmica começará sem casais concluídos ou jornadas atribuídas. Nenhum dado anterior será apagado: uma cópia será mantida no armazenamento local do navegador.</p>{migrationError && <p className="migration-error" role="alert">{migrationError}</p>}<button className="primary-button" onClick={() => { setMigrationError(''); if (!flow.startNewFormat()) setMigrationError('Não foi possível guardar o backup e iniciar. Verifique o armazenamento disponível neste navegador.'); }}>Confirmar e iniciar no novo formato</button></section></div>}
  </div>;
}

function ProgressBar({ index, onBack }: { index: number; onBack: () => void }) {
  const steps = ['Encontro', 'Partilha', 'Palavra', 'Propósito'];
  return <div className="progress-steps" aria-label={`Etapa ${index + 1} de 4`}><button className="stage-back" onClick={onBack}><ChevronLeft size={16}/> Voltar</button>{steps.map((label, i) => <div className={`progress-step ${i <= index ? 'active' : ''}`} key={label}><span>{i + 1}</span><small>{label}</small></div>)}</div>;
}

function QuestionCard({ name, other, text }: { name: string; other: string; text: string }) {
  return <article className="question-card"><div className="question-avatar">{name.charAt(0)}</div><div><span className="question-directed">{name.toUpperCase()} RESPONDE PARA {other.toUpperCase()}</span><p>{text}</p></div></article>;
}

function FinalScreen({ onHome }: { onHome: () => void }) {
  return <section className="final-stage"><ImageOrnament src={appConfig.images.closing} alt="Sagrada Família" className="final-image"/><div className="final-copy"><span className="eyebrow gold">UMA CAMINHADA QUE CONTINUA</span><h2>{appConfig.closingTitle}</h2><p className="final-subtitle">{appConfig.closingSubtitle}</p><div className="final-references">{appConfig.references.map(r => <span key={r}>{r}</span>)}</div><div className="final-message">{appConfig.closing.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><div className="collective-purpose"><span>PROPÓSITO COLETIVO</span><p>{appConfig.collectivePurpose}</p></div><div className="prayer"><span>ORAÇÃO À SAGRADA FAMÍLIA</span><div>{appConfig.closingPrayer.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></div><p className="animator-note">{appConfig.animatorNote}</p><button className="primary-button" onClick={onHome}>Voltar ao início <ChevronRight size={20}/></button></div></section>;
}

interface AdminFlow {
  progress: ReturnType<typeof useActivityProgress>['progress'];
  restore: (id: string) => void;
  cancelAssignment: (id: string) => void;
  resume: (id: string) => void;
  reset: () => void;
  shuffle: () => void;
  reducedMotion: boolean;
  toggleMotion: () => void;
  isConfigurationCompatible: boolean;
}

function AdminPanel({ flow, onClose, confirmReset, setConfirmReset, confirmCancel, setConfirmCancel }: { flow: AdminFlow; onClose: () => void; confirmReset: boolean; setConfirmReset: (value: boolean) => void; confirmCancel: string | null; setConfirmCancel: (value: string | null) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-modal journey-admin" role="dialog" aria-modal="true" aria-labelledby="admin-title"><button className="close-button" onClick={onClose} aria-label="Fechar"><X size={19}/></button><span className="eyebrow gold">PAINEL DO ORGANIZADOR</span><h2 id="admin-title">Jornadas do encontro</h2><p className="admin-disclaimer">Controles locais deste dispositivo. Não possuem proteção por senha.</p><div className="admin-progress"><strong>Progresso</strong><span>{flow.progress.completedIds.length} de {couples.length} casais concluíram</span><div className="progress-track"><span style={{ width: `${flow.progress.completedIds.length / couples.length * 100}%` }}/></div></div>
    {!flow.isConfigurationCompatible && <p className="migration-error" role="alert">A lista tem {couples.length} casais e {journeys.length} jornadas. Ajuste a configuração antes de usar o sorteio.</p>}
    <div className="assignment-table-wrap"><table className="assignment-table"><thead><tr><th>Casal</th><th>Jornada</th><th>Situação e ações</th></tr></thead><tbody>{couples.map(couple => {
      const assignment = flow.progress.assignments[couple.id];
      const journey = journeys.find(item => item.id === assignment?.journeyId);
      const completed = flow.progress.completedIds.includes(couple.id);
      const active = flow.progress.activeId === couple.id;
      const status = completed ? 'Concluído' : active ? 'Em andamento' : assignment ? 'Aguardando retomada' : 'Aguardando sorteio';
      return <tr key={couple.id}><td>{couple.partner1} & {couple.partner2}</td><td>{journey?.title ?? 'Não sorteada'}</td><td><span className="assignment-status">{status}</span><div className="assignment-actions">{completed && <button onClick={() => flow.restore(couple.id)}>Restaurar</button>}{assignment && !completed && !active && <button onClick={() => { flow.resume(couple.id); onClose(); }}>Retomar</button>}{assignment && <button className="cancel-assignment" onClick={() => setConfirmCancel(couple.id)}>Cancelar atribuição</button>}</div>{confirmCancel === couple.id && <div className="confirm-box inline-confirm"><p>Liberar esta jornada e permitir novo sorteio para o casal?</p><button onClick={() => { flow.cancelAssignment(couple.id); setConfirmCancel(null); }}>Confirmar</button><button onClick={() => setConfirmCancel(null)}>Manter</button></div>}</td></tr>;
    })}</tbody></table></div>
    <div className="admin-actions"><button onClick={flow.toggleMotion}>{flow.reducedMotion ? 'Ativar animações' : 'Reduzir animações'}</button><button onClick={flow.shuffle}><Shuffle size={16}/> Embaralhar casais ainda não sorteados</button></div>
    {confirmReset ? <div className="confirm-box"><p>Apagar o progresso novo, liberar todas as jornadas e reiniciar? O backup da versão anterior, se houver, será mantido.</p><button onClick={() => { flow.reset(); onClose(); }}>Sim, reiniciar a dinâmica</button><button onClick={() => setConfirmReset(false)}>Cancelar</button></div> : <button className="reset-button" onClick={() => setConfirmReset(true)}><RotateCcw size={16}/> Reiniciar dinâmica</button>}
  </section></div>;
}

export default App;
