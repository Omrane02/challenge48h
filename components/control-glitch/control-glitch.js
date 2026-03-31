'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── STYLES & KEYFRAMES (Minimal) ───────────────────────────────────────────
const glitchStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

  .font-orbitron { font-family: 'Orbitron', sans-serif !important; }

  /* Scanlines overlay */
  .scanlines::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0, 0, 0, 0.06) 3px,
      rgba(0, 0, 0, 0.06) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

  /* Grid background */
  .grid-bg {
    background-image:
      linear-gradient(rgba(57, 255, 20, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(57, 255, 20, 0.07) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Glitch Animations */
  @keyframes glitch-main {
    0%, 88%, 100% { transform: translate(0, 0); }
    90%           { transform: translate(-3px, 1px); }
    92%           { transform: translate(3px, -1px); }
    94%           { transform: translate(-1px, 2px); }
    96%           { transform: translate(1px, -2px); }
    98%           { transform: translate(0, 0); }
  }
  @keyframes glitch-red {
    0%, 88%, 100% { transform: translate(0, 0); }
    90%           { transform: translate(3px, -1px); }
    92%           { transform: translate(-3px, 1px); }
  }
  @keyframes glitch-layer-1 {
    0%, 88%, 100% { transform: translate(0, 0); opacity: 0; }
    90%           { transform: translate(-5px, 0); opacity: 0.75; }
    92%           { transform: translate(5px, 0); opacity: 0.75; }
    94%           { transform: translate(0, 0); opacity: 0; }
  }
  @keyframes glitch-layer-2 {
    0%, 88%, 100% { transform: translate(0, 0); opacity: 0; }
    91%           { transform: translate(5px, 0); opacity: 0.75; }
    93%           { transform: translate(-5px, 0); opacity: 0.75; }
    95%           { transform: translate(0, 0); opacity: 0; }
  }

  .glitch-title {
    position: relative;
    text-shadow: none;
    animation: glitch-main 4s infinite;
  }
  .glitch-title::before,
  .glitch-title::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
  .glitch-title::before {
    color: #00cfff;
    animation: glitch-layer-1 4s infinite;
    clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  }
  .glitch-title::after {
    color: #ff0040;
    animation: glitch-layer-2 4s infinite;
    clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
  }

  .glitch-title-red {
    color: #ff0040;
    position: relative;
    text-shadow: 0 0 30px rgba(255, 0, 64, 0.5);
    animation: glitch-red 4s infinite 0.5s;
  }

  .glitch-grade {
    position: relative;
    animation: glitch-main 2.5s infinite;
  }
  .glitch-grade::before {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    color: #00cfff;
    animation: glitch-layer-1 2.5s infinite;
    clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
  }
  .glitch-grade::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    color: #ff0040;
    animation: glitch-layer-2 2.5s infinite;
    clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
  }

  /* Screen shake */
  @keyframes screen-shake {
    0%, 100%   { transform: translate(0, 0) rotate(0deg); }
    10%        { transform: translate(-10px, -5px) rotate(-0.6deg); }
    20%        { transform: translate(10px, 5px) rotate(0.6deg); }
    30%        { transform: translate(-8px, 8px) rotate(-0.4deg); }
    40%        { transform: translate(8px, -8px) rotate(0.4deg); }
    50%        { transform: translate(-5px, 5px) rotate(-0.2deg); }
    60%        { transform: translate(5px, -3px) rotate(0.2deg); }
    70%        { transform: translate(-3px, 3px) rotate(-0.1deg); }
    80%        { transform: translate(3px, -3px) rotate(0.1deg); }
  }
  .screen-shake { animation: screen-shake 0.55s ease-out !important; }

  /* Red flash */
  @keyframes flash-red { 0% { opacity: 0.55; } 100% { opacity: 0; } }
  .flash-red { animation: flash-red 0.45s ease-out forwards; }

  /* Entrance animations */
  @keyframes cg-fadeUp { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:translateY(0);} }
  .cg-enter    { animation: cg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .cg-enter-d1 { animation: cg-fadeUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
  .cg-enter-d2 { animation: cg-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
  .cg-enter-d3 { animation: cg-fadeUp 0.5s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
  .cg-enter-d4 { animation: cg-fadeUp 0.5s 0.32s cubic-bezier(0.22,1,0.36,1) both; }

  /* Target Animations */
  @keyframes target-appear {
    0%   { transform: scale(0) rotate(200deg); opacity: 0; }
    65%  { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .target-appear { animation: target-appear 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

  @keyframes target-pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.07); }
  }
  .target-pulse { animation: target-pulse 1.6s ease-in-out infinite; }

  @keyframes chaos-a {
    0%   { transform: translate(0px, 0px); }
    25%  { transform: translate(14px, -10px); }
    50%  { transform: translate(-10px, 14px); }
    75%  { transform: translate(8px, 8px); }
    100% { transform: translate(0px, 0px); }
  }
  @keyframes chaos-b {
    0%   { transform: translate(0px, 0px); }
    25%  { transform: translate(-16px, 8px); }
    50%  { transform: translate(12px, -12px); }
    75%  { transform: translate(-6px, -10px); }
    100% { transform: translate(0px, 0px); }
  }
  @keyframes chaos-c {
    0%   { transform: translate(0px, 0px); }
    33%  { transform: translate(18px, 6px); }
    66%  { transform: translate(-12px, -14px); }
    100% { transform: translate(0px, 0px); }
  }
  .target-chaos-a { animation: chaos-a var(--dur, 0.85s) ease-in-out infinite, target-pulse 1.4s ease-in-out infinite; }
  .target-chaos-b { animation: chaos-b var(--dur, 0.95s) ease-in-out infinite, target-pulse 1.4s ease-in-out infinite; }
  .target-chaos-c { animation: chaos-c var(--dur, 0.75s) ease-in-out infinite, target-pulse 1.4s ease-in-out infinite; }

  /* Score popup */
  @keyframes score-popup {
    0%   { transform: translate(-50%, -50%) translateY(0px); opacity: 1; }
    100% { transform: translate(-50%, -50%) translateY(-50px); opacity: 0; }
  }
  .score-popup { animation: score-popup 0.85s ease-out forwards; pointer-events: none; }

  /* Phase flash */
  @keyframes phase-flash {
    0%, 100% { opacity: 1; }
    25%       { opacity: 0.2; }
    50%       { opacity: 1; }
    75%       { opacity: 0.3; }
  }
  .phase-flash { animation: phase-flash 0.6s ease-out; }

  /* Neon border glow */
  @keyframes border-glow {
    0%, 100% { box-shadow: inset 0 0 40px rgba(57, 255, 20, 0.05); }
    50%       { box-shadow: inset 0 0 70px rgba(57, 255, 20, 0.12); }
  }
  .border-glow { animation: border-glow 2.5s ease-in-out infinite; }
`;

// ─── CONSTANTS & CONFIG ───────────────────────────────────────────────────────
const TOTAL_TIME = 60;
const COLORS = {
  red: '#ff0040',
  blue: '#00cfff',
  yellow: '#ffcc00',
  green: '#39ff14',
  purple: '#cc44ff',
  orange: '#ff8800',
};
const WRONG_COLORS = ['blue', 'yellow', 'green', 'purple', 'orange'];
const PHASE_COLORS = { 1: '#39ff14', 2: '#00cfff', 3: '#ffcc00', 4: '#ff8800', 5: '#ff0040' };

const PHASE_DATA = {
  1: {
    label: 'PHASE NORMALE',
    instruction: 'Clique sur la cible ROUGE',
    sub: "Suis les instructions. Simple. Pour l'instant.",
    color: '#39ff14',
    icon: '◉',
  },
  2: {
    label: 'MENSONGE ACTIVÉ',
    instruction: 'Clique sur la cible BLEUE',
    sub: 'Est-ce vraiment la vérité ? Réfléchis bien...',
    color: '#00cfff',
    icon: '⚠',
  },
  3: {
    label: 'PIÈGE TENDU',
    instruction: 'Clique sur la cible la plus GROSSE',
    sub: "Plus c'est gros, mieux c'est... vraiment ?",
    color: '#ffcc00',
    icon: '⊗',
  },
  4: {
    label: 'MODE CHAOS',
    instruction: 'Clique sur la cible ROUGE',
    sub: 'Les cibles bougent. Reste concentré.',
    color: '#ff8800',
    icon: '✦',
  },
  5: {
    label: 'PHASE TROLL',
    instruction: 'NE CLIQUE SUR RIEN. RIEN DU TOUT.',
    sub: 'Vraiment. Arrête-toi. Le jeu est terminé.',
    color: '#ff0040',
    icon: '✕',
  },
};

const END_TIPS = [
  "Phase 2 : La vérité est le contraire de l'instruction.",
  'Phase 3 : Les petites cibles sont les bonnes.',
  'Phase 4 : Rouge reste correct malgré le chaos.',
  'Phase 5 : Clique quand même sur rouge.',
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
function getPhase(timeLeft) {
  const elapsed = TOTAL_TIME - timeLeft;
  if (elapsed < 12) return 1;
  if (elapsed < 24) return 2;
  if (elapsed < 36) return 3;
  if (elapsed < 48) return 4;
  return 5;
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function generateTargets(phase) {
  const count = phase === 4 ? 6 : 5;
  const targets = [];
  const positions = [];

  for (let i = 0; i < count; i++) {
    let x, y, attempts = 0;
    do {
      x = randomInRange(10, 88);
      y = randomInRange(12, 82);
      attempts++;
    } while (
      attempts < 50 &&
      positions.some((p) => Math.abs(p.x - x) < 14 && Math.abs(p.y - y) < 14)
    );
    positions.push({ x, y });
  }

  for (let i = 0; i < count; i++) {
    const { x, y } = positions[i];
    let color, size, isCorrect;

    if (phase === 1) {
      if (i === 0) { color = COLORS.red; size = 'md'; isCorrect = true; } 
      else { color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]; size = ['sm', 'md', 'lg'][Math.floor(Math.random() * 3)]; isCorrect = false; }
    } else if (phase === 2) {
      if (i === 0) { color = COLORS.red; size = 'sm'; isCorrect = true; } 
      else if (i === 1) { color = COLORS.blue; size = 'xl'; isCorrect = false; } 
      else { color = COLORS[WRONG_COLORS[(i + 1) % WRONG_COLORS.length]]; size = 'md'; isCorrect = false; }
    } else if (phase === 3) {
      if (i === 0) { color = COLORS.red; size = 'sm'; isCorrect = true; } 
      else if (i === 1) { color = COLORS.yellow; size = 'xl'; isCorrect = false; } 
      else if (i === 2) { color = COLORS.blue; size = 'lg'; isCorrect = false; } 
      else { color = COLORS[WRONG_COLORS[i % WRONG_COLORS.length]]; size = 'md'; isCorrect = false; }
    } else if (phase === 4) {
      if (i === 0) { color = COLORS.red; size = 'md'; isCorrect = true; } 
      else { color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]; size = ['sm', 'md'][Math.floor(Math.random() * 2)]; isCorrect = false; }
    } else {
      if (i === 0) { color = COLORS.red; size = 'md'; isCorrect = true; } 
      else { color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]; size = 'md'; isCorrect = false; }
    }

    targets.push({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x, y, color, size, isCorrect,
      delay: i * 75,
      chaosDuration: parseFloat((0.55 + Math.random() * 0.7).toFixed(2)),
      chaosVariant: i % 3,
    });
  }
  return targets.sort(() => Math.random() - 0.5);
}

function playBeep(type) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (_) {}
}

function getPerformance(score) {
  if (score > 250) return { grade: 'S', rank: 'UNHACKABLE', message: "Tu n'as pas cédé une seule fois. Le système ne peut rien contre toi.", color: '#39ff14' };
  if (score > 150) return { grade: 'A', rank: 'GLITCH MASTER', message: 'Le système a essayé fort. Tu as su résister à presque tout.', color: '#00cfff' };
  if (score > 70) return { grade: 'B', rank: 'RÉSISTANCE CORRECTE', message: "Quelques pièges t'ont eu, mais tu t'en es plutôt bien sorti.", color: '#ffcc00' };
  if (score > 10) return { grade: 'C', rank: 'FACILEMENT PIÉGÉ', message: 'Le glitch a bien joué avec ta tête. Tu as cru trop de choses.', color: '#ff8800' };
  if (score > -20) return { grade: 'D', rank: 'TROP CRÉDULE', message: "Tu as tout cru. Sans hésiter. Le système t'a possédé.", color: '#ff4400' };
  return { grade: 'F', rank: 'TOTAL CHAOS', message: "Le glitch a pris le contrôle total. Tu n'existais plus.", color: '#ff0040' };
}


// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function TargetItem({ target, onClick, isChaos }) {
  const [appeared, setAppeared] = useState(false);
  const SIZE_MAP = { sm: 42, md: 62, lg: 86, xl: 112 };

  useEffect(() => {
    const delay = target.delay ?? 0;
    const t = setTimeout(() => setAppeared(true), delay);
    return () => clearTimeout(t);
  }, [target.delay, target.id]);

  const size = SIZE_MAP[target.size] || 62;
  const chaosClass = ['target-chaos-a', 'target-chaos-b', 'target-chaos-c'][target.chaosVariant % 3];
  const animClass = isChaos ? chaosClass : 'target-pulse';

  return (
    <div
      className="absolute"
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
        marginLeft: `-${size / 2}px`,
        marginTop: `-${size / 2}px`,
        opacity: appeared ? 1 : 0,
        transition: 'opacity 0.1s',
        '--dur': `${target.chaosDuration ?? 0.85}s`,
      }}
    >
      <button
        onClick={onClick}
        className={`relative rounded-full cursor-pointer focus:outline-none ${appeared ? 'target-appear' : ''} ${animClass}`}
        style={{
          width: size,
          height: size,
          backgroundColor: target.color,
          boxShadow: `0 0 18px ${target.color}90, 0 0 40px ${target.color}40`,
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="absolute rounded-full border border-white/25" style={{ inset: '18%' }} />
        <div className="absolute rounded-full bg-white/40" style={{ inset: '38%' }} />
        <div className="absolute rounded-full bg-white/20 blur-[2px]" style={{ top: '10%', left: '15%', width: '35%', height: '25%' }} />
      </button>
    </div>
  );
}

function Timer({ timeLeft, totalTime = 60 }) {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const barColor = isCritical ? '#ff0040' : isLow ? 'linear-gradient(90deg, #ff8800, #ff0040)' : 'linear-gradient(90deg, #39ff14, #00cfff)';

  return (
    <div className="flex items-center gap-4 w-full">
      <div
        className="font-orbitron text-3xl font-black tabular-nums leading-none min-w-[3ch]"
        style={{
          color: isCritical ? '#ff0040' : isLow ? '#ff8800' : '#ffffff',
          animation: isCritical ? 'target-pulse 0.6s ease-in-out infinite' : 'none',
          textShadow: isCritical ? '0 0 20px #ff0040' : 'none',
        }}
      >
        {String(timeLeft).padStart(2, '0')}
      </div>
      <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percentage}%`,
            background: barColor,
            boxShadow: isCritical ? '0 0 8px #ff0040' : isLow ? '0 0 8px #ff8800' : '0 0 8px #39ff14',
          }}
        />
        {[20, 40, 60, 80].map((p) => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${p}%` }} />
        ))}
      </div>
    </div>
  );
}


function Instructions({ phase, phaseChanged }) {
  const data = PHASE_DATA[phase] || PHASE_DATA[1];

  return (
    <div className={`text-center ${phaseChanged ? 'phase-flash' : ''}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span
          className="font-mono text-xs tracking-[0.25em] uppercase px-2 py-0.5 rounded-sm border"
          style={{ color: data.color, borderColor: data.color + '50', backgroundColor: data.color + '10' }}
        >
          {data.icon} {data.label}
        </span>
      </div>
      <p className="font-orbitron text-xl md:text-2xl font-bold leading-tight text-white">{data.instruction}</p>
      <p className="font-mono text-xs text-gray-500 mt-1 tracking-wide">{data.sub}</p>
    </div>
  );
}

// ─── MAIN COMPONENT VIEWS ─────────────────────────────────────────────────────

function GameBoard({ onGameEnd }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [phaseChanged, setPhaseChanged] = useState(false);
  const [scorePopups, setScorePopups] = useState([]);
  
  const prevPhaseRef = useRef(0);
  const scoreRef = useRef(0);

  const currentPhase = getPhase(timeLeft);
  const phaseColor = PHASE_COLORS[currentPhase];

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { setTargets(generateTargets(1)); }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onGameEnd(scoreRef.current);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, onGameEnd]);

  useEffect(() => {
    if (prevPhaseRef.current === 0) {
      prevPhaseRef.current = 1;
      return;
    }
    if (currentPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhase;
      setPhaseChanged(true);
      setTargets(generateTargets(currentPhase));
      const t = setTimeout(() => setPhaseChanged(false), 700);
      return () => clearTimeout(t);
    }
  }, [currentPhase]);

  const spawnPopup = useCallback((text, x, y, good) => {
    const id = Date.now() + Math.random();
    setScorePopups((prev) => [...prev, { id, text, x, y, good }]);
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  }, []);

  const handleTargetClick = useCallback((target) => {
      if (target.isCorrect) {
        setScore((s) => s + 10);
        playBeep('correct');
        spawnPopup('+10', target.x, target.y, true);
      } else {
        setScore((s) => s - 5);
        playBeep('wrong');
        spawnPopup('-5', target.x, target.y, false);
        setShaking(true);
        setFlashing(true);
        setTimeout(() => setShaking(false), 560);
        setTimeout(() => setFlashing(false), 450);
      }
      setTimeout(() => setTargets(generateTargets(currentPhase)), 160);
    },
    [currentPhase, spawnPopup]
  );

  return (
    <div className={`min-h-screen bg-[#05050f] flex flex-col relative overflow-hidden ${shaking ? 'screen-shake' : ''}`}>
      {flashing && <div className="absolute inset-0 bg-[#ff0040] z-50 pointer-events-none flash-red" />}
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      <header className="relative z-20 px-5 pt-5 pb-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-5 mb-3">
            <div className="shrink-0">
              <div className="font-mono text-[9px] tracking-[0.3em] text-gray-600 uppercase mb-0.5">Score</div>
              <div
                className="font-orbitron text-2xl font-black tabular-nums leading-none"
                style={{ color: score < 0 ? '#ff0040' : '#ffffff', textShadow: score < 0 ? '0 0 12px #ff004080' : 'none', minWidth: '5ch' }}
              >
                {score}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[9px] tracking-[0.3em] text-gray-600 uppercase">Temps</span>
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: phaseColor }}>
                  Phase {currentPhase} / 5
                </span>
              </div>
              <Timer timeLeft={timeLeft} />
            </div>
          </div>
          <div className="flex gap-1.5 mb-4">
            {[1, 2, 3, 4, 5].map((p) => (
              <div
                key={p}
                className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: p < currentPhase ? PHASE_COLORS[p] + '50' : p === currentPhase ? PHASE_COLORS[p] : 'rgba(255,255,255,0.08)',
                  boxShadow: p === currentPhase ? `0 0 10px ${PHASE_COLORS[p]}` : 'none',
                }}
              />
            ))}
          </div>
          <Instructions phase={currentPhase} phaseChanged={phaseChanged} />
        </div>
      </header>

      <main className="flex-1 relative px-5 pb-5 max-w-4xl w-full mx-auto">
        <div
          className="relative w-full h-full rounded-md border overflow-hidden border-glow"
          style={{ minHeight: 420, borderColor: phaseColor + '35', background: `radial-gradient(ellipse at 50% 50%, ${phaseColor}06 0%, transparent 70%)` }}
        >
          {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((cls, i) => (
            <div key={i} className={`absolute w-5 h-5 ${cls}`} style={{ borderColor: phaseColor + '60' }} />
          ))}

          {targets.map((target) => (
            <TargetItem key={target.id} target={target} onClick={() => handleTargetClick(target)} isChaos={currentPhase === 4} />
          ))}

          {scorePopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute font-orbitron font-black text-xl score-popup"
              style={{ left: `${popup.x}%`, top: `${popup.y}%`, color: popup.good ? '#39ff14' : '#ff0040', textShadow: `0 0 12px ${popup.good ? '#39ff14' : '#ff0040'}` }}
            >
              {popup.text}
            </div>
          ))}

          {phaseChanged && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="font-orbitron font-black text-4xl tracking-widest phase-flash" style={{ color: phaseColor, textShadow: `0 0 30px ${phaseColor}` }}>
                PHASE {currentPhase}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EndScreen({ score, onReplay, onBack }) {
  const perf = getPerformance(score);
  const [visible, setVisible] = useState(false);
  const [countedScore, setCountedScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const steps = 40;
    const step = score / steps;
    let current = 0;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      current += step;
      setCountedScore(Math.round(current));
      if (i >= steps) {
        setCountedScore(score);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [visible, score]);

  return (
    <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 40%, ${perf.color}08 0%, transparent 65%)` }} />
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 opacity-30" style={{ borderColor: perf.color }} />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 opacity-30" style={{ borderColor: perf.color }} />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 opacity-30" style={{ borderColor: perf.color }} />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 opacity-30" style={{ borderColor: perf.color }} />

      <div className="relative z-10 text-center w-full max-w-lg transition-all duration-700" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}>
        <div className="cg-enter font-mono text-xs tracking-[0.4em] text-gray-600 mb-8 uppercase">▸ GAME OVER ◂</div>
        <div className="cg-enter-d1 font-orbitron text-[9rem] font-black leading-none mb-2 glitch-grade select-none" style={{ color: perf.color, textShadow: `0 0 60px ${perf.color}50` }} data-text={perf.grade}>
          {perf.grade}
        </div>
        <div className="cg-enter-d2 font-orbitron text-lg font-bold tracking-[0.15em] uppercase mb-3" style={{ color: perf.color }}>{perf.rank}</div>
        <p className="font-mono text-sm text-gray-400 leading-relaxed mb-10 max-w-xs mx-auto">{perf.message}</p>

        <div className="cg-enter-d3 inline-block border rounded-sm px-12 py-6 mb-8" style={{ borderColor: perf.color + '40', background: perf.color + '06' }}>
          <div className="font-mono text-[10px] tracking-[0.3em] text-gray-600 mb-3 uppercase">Score Final</div>
          <div className="font-orbitron text-6xl font-black tabular-nums leading-none" style={{ color: score < 0 ? '#ff0040' : '#ffffff', textShadow: score < 0 ? '0 0 20px #ff004080' : '0 0 20px rgba(255,255,255,0.2)' }}>
            {countedScore}
          </div>
          <div className="font-mono text-xs text-gray-600 mt-2">pts</div>
        </div>

        <div className="cg-enter-d4 border border-white/5 rounded-sm p-4 mb-10 text-left bg-white/[0.02]">
          <div className="font-mono text-[10px] tracking-widest text-gray-600 mb-3 uppercase">💡 Secrets révélés</div>
          <ul className="space-y-1.5">
            {END_TIPS.map((tip, i) => (
              <li key={i} className="font-mono text-xs text-gray-500 flex gap-2"><span style={{ color: perf.color }}>▸</span>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onReplay}
            className="group relative font-orbitron font-bold text-base tracking-widest uppercase px-14 py-4 border-2 transition-all duration-200 cursor-pointer"
            style={{ borderColor: perf.color, color: perf.color }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = perf.color; e.currentTarget.style.color = '#05050f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = perf.color; }}
          >
            REJOUER
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 -z-10 border opacity-20 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-200" style={{ borderColor: perf.color }} />
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="font-mono text-xs tracking-widest uppercase px-8 py-2 border transition-all duration-200 cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#666' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
              ← ARCADE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function ControlGlitch({ onWin, onBack }) {
  const [gameState, setGameState] = useState('home'); // 'home' | 'playing' | 'ended'
  const [finalScore, setFinalScore] = useState(0);

  function handleGameEnd(score) {
    setFinalScore(score);
    setGameState('ended');
    if (onWin) onWin();
  }

  if (gameState === 'playing') {
    return (
      <>
        <style>{glitchStyles}</style>
        <GameBoard onGameEnd={handleGameEnd} />
      </>
    );
  }

  if (gameState === 'ended') {
    return (
      <>
        <style>{glitchStyles}</style>
        <EndScreen score={finalScore} onReplay={() => setGameState('home')} onBack={onBack} />
      </>
    );
  }

  return (
    <>
      <style>{glitchStyles}</style>
      <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
        <div className="absolute inset-0 scanlines pointer-events-none" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none blur-[40px]" style={{ background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none blur-[40px]" style={{ background: 'radial-gradient(circle, rgba(255,0,64,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center px-6 w-full max-w-2xl">
          <div className="cg-enter font-mono text-[10px] tracking-[0.4em] text-gray-600 uppercase mb-6">
            ▶ SYSTEM_OVERRIDE · v2.7.1 · INFILTRATION EN COURS
          </div>

          <div className="cg-enter-d1 mb-10">
            <h1 className="font-orbitron text-7xl md:text-9xl font-black text-white leading-none glitch-title select-none" data-text="CONTROL">
              CONTROL
            </h1>
            <h1 className="font-orbitron text-7xl md:text-9xl font-black leading-none select-none glitch-title-red -mt-[0.05em]" data-text="GLITCH">
              GLITCH
            </h1>
          </div>

          <p className="cg-enter-d2 font-mono text-sm text-gray-400 leading-relaxed mb-10 max-w-md mx-auto">
            60 secondes. 5 phases. Les règles changent à chaque fois.{' '}
            <span style={{ color: '#ff0040' }}>Ne faites confiance à aucune instruction.</span>
          </p>

          <div className="cg-enter-d3 grid grid-cols-5 gap-2 mb-10">
            {[
              { num: '01', name: 'NORMAL', color: '#39ff14', icon: '◉' },
              { num: '02', name: 'MENSONGE', color: '#00cfff', icon: '⚠' },
              { num: '03', name: 'PIÈGE', color: '#ffcc00', icon: '⊗' },
              { num: '04', name: 'CHAOS', color: '#ff8800', icon: '✦' },
              { num: '05', name: 'TROLL', color: '#ff0040', icon: '✕' },
            ].map((p) => (
              <div key={p.num} className="border rounded-sm p-2.5 text-center transition-all duration-200 hover:bg-white/5 cursor-default" style={{ borderColor: p.color + '30', background: p.color + '06' }}>
                <div className="font-mono text-base mb-1" style={{ color: p.color }}>{p.icon}</div>
                <div className="font-mono text-[9px] text-gray-600 mb-1">{p.num}</div>
                <div className="font-mono text-[9px] font-bold tracking-wider" style={{ color: p.color + 'cc' }}>{p.name}</div>
              </div>
            ))}
          </div>

          <div className="relative inline-block mb-8">
            <button
              onClick={() => setGameState('playing')}
              className="group relative font-orbitron font-bold text-lg md:text-xl tracking-widest uppercase px-14 py-4 border-2 transition-all duration-200 cursor-pointer"
              style={{ borderColor: '#39ff14', color: '#39ff14' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#39ff14'; e.currentTarget.style.color = '#05050f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#39ff14'; }}
            >
              LANCER LE JEU
              <div className="absolute inset-0 translate-x-2 translate-y-2 -z-10 border border-[#39ff14]/25 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-200" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 font-mono text-xs text-gray-600">
            <span>✓ Bon clic <span style={{ color: '#39ff14' }} className="font-bold">+10 pts</span></span>
            <span className="text-gray-700">·</span>
            <span>✗ Erreur <span style={{ color: '#ff0040' }} className="font-bold">-5 pts</span></span>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 font-mono text-xs tracking-widest uppercase px-8 py-2 border transition-all duration-200 cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#666' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
              ← ARCADE
            </button>
          )}
        </div>
      </div>
    </>
  );
}