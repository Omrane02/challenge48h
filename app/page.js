'use client';

import { useState, useEffect, useRef } from 'react';
import RhythmGame from "../components/rythme-game/jeu_rythme";
import ControlGlitch from "@/components/control-glitch/control-glitch";
import MemoryGame from "@/components/memory-game/memory-game";
import QuestGame from "@/components/quest-game/QuestGame";
import MirrorSequence from "@/components/mirror-game/mirror";
import TuneSwitch from "@/components/Tune swicth/tune-switch";

/* ─── Game metadata with per-game identity ─── */
const GAMES = [
  {
    id: 'rhythm',
    name: 'Jeu de Rythme',
    component: RhythmGame,
    description: 'Suis le beat, frappe au bon moment.',
    tag: 'RYTHME',
    number: '01',
    accent: '#00e5ff',
    glow: 'rgba(0,229,255,0.35)',
    dimGlow: 'rgba(0,229,255,0.08)',
    icon: '♩',
    iconBg: 'radial-gradient(circle at 40% 35%, #0a2a30 0%, #050d10 100%)',
    letter: 'B',
  },
  {
    id: 'glitch',
    name: 'Control Glitch',
    component: ControlGlitch,
    description: 'Fais confiance à personne. Surtout pas aux instructions.',
    tag: 'CHAOS',
    number: '02',
    accent: '#ff0040',
    glow: 'rgba(255,0,64,0.35)',
    dimGlow: 'rgba(255,0,64,0.08)',
    icon: '⊗',
    iconBg: 'radial-gradient(circle at 40% 35%, #2a0010 0%, #100005 100%)',
    letter: 'U',
  },
  {
    id: 'memory',
    name: 'Memory Game',
    component: MemoryGame,
    description: 'Mémorise. Retrouve. Recommence.',
    tag: 'MÉMOIRE',
    number: '03',
    accent: '#bf00ff',
    glow: 'rgba(191,0,255,0.35)',
    dimGlow: 'rgba(191,0,255,0.08)',
    icon: '◈',
    iconBg: 'radial-gradient(circle at 40% 35%, #1a0028 0%, #080010 100%)',
    letter: 'Z',
  },
  {
    id: 'quest',
    name: 'Quest Game',
    component: QuestGame,
    description: 'Chaque choix compte. Bonne chance.',
    tag: 'AVENTURE',
    number: '04',
    accent: '#ffd000',
    glow: 'rgba(255,208,0,0.35)',
    dimGlow: 'rgba(255,208,0,0.08)',
    icon: '⚔',
    iconBg: 'radial-gradient(circle at 40% 35%, #2a2000 0%, #100d00 100%)',
    letter: 'U',
  },
  {
    id: 'mirror',
    name: 'Mirror Sequence',
    component: MirrorSequence,
    description: 'Observe. Reproduis. Ne te trompe pas.',
    tag: 'SÉQUENCE',
    number: '05',
    accent: '#39ff14',
    glow: 'rgba(57,255,20,0.35)',
    dimGlow: 'rgba(57,255,20,0.08)',
    icon: '⬡',
    iconBg: 'radial-gradient(circle at 40% 35%, #0a2000 0%, #040d00 100%)',
    letter: 'K',
  },
  {
    id: 'tune',
    name: 'Tune Switch',
    component: TuneSwitch,
    description: 'Accorde les cordes avant qu\'elles cassent.',
    tag: 'MUSIQUE',
    number: '06',
    accent: '#facc15',
    glow: 'rgba(250,204,21,0.35)',
    dimGlow: 'rgba(250,204,21,0.08)',
    icon: '♪',
    iconBg: 'radial-gradient(circle at 40% 35%, #2a2200 0%, #100e00 100%)',
    letter: 'I',
  },
];

/* ─── Mailbox Panel ─── */
function MailboxPanel({ unlockedLevel }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="fixed top-1/2 right-0 z-50 flex flex-col items-end"
      style={{ transform: 'translateY(-50%)' }}
    >
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-4 font-mono text-[9px] tracking-[0.25em] uppercase transition-all"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          background: 'rgba(8,8,20,0.95)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          color: '#444',
          cursor: 'pointer',
          letterSpacing: '0.2em',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
        onMouseLeave={e => e.currentTarget.style.color = '#444'}
      >
        {open ? '▶' : '◀'} &nbsp; boîte aux lettres
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 flex flex-col gap-2 p-4 rounded-l-2xl"
          style={{
            top: '50%',
            transform: 'translate(0, -50%)',
            marginRight: '28px',
            background: 'rgba(8,8,20,0.95)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
            minWidth: '90px',
          }}
        >
          {/* Title */}
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-center mb-1" style={{ color: '#333' }}>
            ✉ lettres
          </p>

          {/* One slot per game */}
          {GAMES.map((game, i) => {
            const completed = i < unlockedLevel - 1; // jeu terminé → lettre visible
            return (
              <div
                key={game.id}
                className="flex flex-col items-center gap-1"
              >
                {/* Number */}
                <span className="font-mono text-[7px]" style={{ color: completed ? game.accent + '80' : '#222' }}>
                  {game.number}
                </span>
                {/* Letter box */}
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500"
                  style={{
                    background: completed ? `${game.accent}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${completed ? game.accent + '50' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: completed ? `0 0 10px ${game.dimGlow}` : 'none',
                  }}
                >
                  {completed ? (
                    <span
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.4rem',
                        color: game.accent,
                        textShadow: `0 0 10px ${game.glow}`,
                        lineHeight: 1,
                      }}
                    >
                      {game.letter}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', opacity: 0.15 }}>?</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Divider */}
          <div className="h-px w-full my-1" style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Assembled word preview */}
          <div className="flex flex-col items-center gap-0.5">
            {GAMES.map((game, i) => {
              const completed = i < unlockedLevel - 1;
              return (
                <span
                  key={game.id}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '0.85rem',
                    color: completed ? game.accent : '#1a1a2e',
                    lineHeight: 1.1,
                    letterSpacing: '0.05em',
                  }}
                >
                  {completed ? game.letter : '·'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Animated grid bg (canvas) ─── */
function GridCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      t += 0.004;

      const cols = 22, rows = 16;
      const cellW = w / cols, cellH = h / rows;

      ctx.strokeStyle = 'rgba(0,229,255,0.055)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, h);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(w, y * cellH);
        ctx.stroke();
      }

      // Moving scan line
      const scanY = ((Math.sin(t * 0.5) * 0.5 + 0.5) * h * 1.1) - h * 0.05;
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0, 'rgba(0,229,255,0)');
      grad.addColorStop(0.5, 'rgba(0,229,255,0.045)');
      grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, w, 80);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 1 }}
    />
  );
}

/* ─── Individual game card ─── */
function GameCard({ game, index, isUnlocked, isNextToUnlock, previousGame, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col"
      style={{
        animation: `cardReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${index * 90}ms`,
      }}
    >
      <button
        disabled={!isUnlocked}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex flex-col h-full text-left outline-none"
        style={{
          cursor: isUnlocked ? 'pointer' : 'not-allowed',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: hovered && isUnlocked ? 'translateY(-8px)' : 'translateY(0)',
        }}
      >
        {/* Card body */}
        <div
          className="relative flex flex-col h-full rounded-2xl overflow-hidden border transition-all duration-300"
          style={{
            background: isUnlocked
              ? `linear-gradient(145deg, rgba(12,12,24,0.98) 0%, rgba(8,8,16,0.99) 100%)`
              : 'rgba(6,6,12,0.7)',
            borderColor: isUnlocked
              ? hovered
                ? game.accent
                : `${game.accent}45`
              : 'rgba(255,255,255,0.04)',
            boxShadow: isUnlocked && hovered
              ? `0 0 0 1px ${game.accent}60, 0 20px 60px ${game.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
              : isUnlocked
              ? `0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
              : 'none',
          }}
        >
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
              opacity: 0.4,
            }}
          />

          {/* Icon zone */}
          <div
            className="relative h-32 w-full flex items-center justify-center overflow-hidden"
            style={{ background: isUnlocked ? game.iconBg : 'rgba(5,5,10,0.9)' }}
          >
            {isUnlocked ? (
              <>
                {/* Glow behind icon */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 50% 60%, ${game.dimGlow} 0%, transparent 70%)`,
                    opacity: hovered ? 1 : 0.6,
                    transition: 'opacity 0.3s',
                  }}
                />
                {/* Number */}
                <span
                  className="absolute top-3 left-4 font-mono text-[10px] tracking-widest font-bold opacity-30"
                  style={{ color: game.accent }}
                >
                  {game.number}
                </span>
                {/* Tag */}
                <span
                  className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-sm"
                  style={{
                    color: game.accent,
                    background: `${game.accent}18`,
                    border: `1px solid ${game.accent}35`,
                  }}
                >
                  {game.tag}
                </span>
                {/* Icon */}
                <span
                  className="relative z-10 select-none"
                  style={{
                    fontSize: '3.2rem',
                    color: game.accent,
                    textShadow: hovered
                      ? `0 0 30px ${game.accent}, 0 0 60px ${game.glow}`
                      : `0 0 16px ${game.accent}80`,
                    transition: 'text-shadow 0.3s',
                    fontFamily: 'monospace',
                    lineHeight: 1,
                  }}
                >
                  {game.icon}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl opacity-15">🔒</span>
                <span className="font-mono text-[9px] tracking-widest text-gray-700 uppercase">
                  Verrouillé
                </span>
              </div>
            )}
          </div>

          {/* Thin accent line */}
          <div
            className="h-px w-full"
            style={{
              background: isUnlocked
                ? `linear-gradient(90deg, transparent, ${game.accent}60, transparent)`
                : 'rgba(255,255,255,0.04)',
            }}
          />

          {/* Content */}
          <div className="flex flex-col flex-1 p-5">
            {isUnlocked ? (
              <>
                <h3
                  className="font-bold text-base leading-tight mb-2"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                    color: '#f0f0f8',
                  }}
                >
                  {game.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed flex-1" style={{ fontFamily: 'monospace' }}>
                  {game.description}
                </p>
                <div className="mt-5">
                  <div
                    className="relative w-full py-2.5 rounded-lg text-center font-bold text-sm overflow-hidden transition-all duration-200"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: '0.12em',
                      fontSize: '0.8rem',
                      color: hovered ? '#000' : game.accent,
                      background: hovered ? game.accent : 'transparent',
                      border: `1px solid ${game.accent}`,
                      boxShadow: hovered ? `0 0 20px ${game.glow}` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    JOUER →
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col flex-1 justify-center items-center text-center gap-2">
                <p className="text-gray-700 text-xs font-mono leading-relaxed">
                  {isNextToUnlock && previousGame ? (
                    <>
                      Réussis{' '}
                      <span className="text-gray-500 font-semibold">{previousGame.name}</span>
                      {' '}pour débloquer
                    </>
                  ) : (
                    'Continue ta progression'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

/* ─── Secret Code Section ─── */
const FINAL_CODE = 'BUZUKI';

function SecretCodeSection() {
  const [open, setOpen] = useState(false);
  const [letters, setLetters] = useState(Array(GAMES.length).fill(''));
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'

  const allFilled = letters.every(l => l.trim() !== '');
  const assembled = letters.join('');

  function handleChange(i, val) {
    const copy = [...letters];
    copy[i] = val.toUpperCase().slice(-1);
    setLetters(copy);
    setResult(null);
  }

  function validate() {
    setResult(assembled.toUpperCase() === FINAL_CODE.toUpperCase() ? 'correct' : 'wrong');
  }

  return (
    <div className="mt-16 w-full flex flex-col items-center gap-5" style={{ animation: 'scanFade 0.6s ease both 1s', opacity: 0 }}>

      {/* Toggle button */}
      <button
        onClick={() => { setOpen(o => !o); setResult(null); }}
        className="flex items-center gap-3 font-mono text-[11px] tracking-[0.35em] uppercase px-6 py-3 rounded border transition-all"
        style={{
          color: open ? '#fff' : '#555',
          borderColor: open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#555'; } }}
      >
        <span style={{ fontSize: '0.65rem' }}>{open ? '▲' : '▼'}</span>
        {open ? 'MASQUER LE CODE SECRET' : 'DÉCHIFFRER LE CODE SECRET'}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: 'rgba(8,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: '#444' }}>
              Fragments collectés
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Letter inputs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {GAMES.map((game, i) => (
              <div key={game.id} className="flex flex-col items-center gap-2">
                {/* Game label */}
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase text-center leading-tight"
                  style={{ color: game.accent + 'aa' }}
                >
                  {game.number}
                </span>
                {/* Input */}
                <input
                  type="text"
                  maxLength={1}
                  value={letters[i]}
                  onChange={e => handleChange(i, e.target.value)}
                  placeholder="?"
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg outline-none transition-all duration-200 uppercase"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    background: letters[i] ? `${game.accent}12` : 'rgba(12,12,24,0.8)',
                    border: `1px solid ${letters[i] ? game.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                    color: letters[i] ? game.accent : '#333',
                    boxShadow: letters[i] ? `0 0 12px ${game.dimGlow}` : 'none',
                    caretColor: game.accent,
                  }}
                  onFocus={e => { e.target.style.borderColor = game.accent; e.target.style.boxShadow = `0 0 16px ${game.glow}`; }}
                  onBlur={e => { e.target.style.borderColor = letters[i] ? game.accent + '60' : 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = letters[i] ? `0 0 12px ${game.dimGlow}` : 'none'; }}
                />
                {/* Game tag */}
                <span
                  className="font-mono text-[7px] tracking-widest uppercase text-center"
                  style={{ color: '#333' }}
                >
                  {game.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Assembled code preview */}
          {assembled.replace(/\s/g, '') && (
            <div className="flex justify-center gap-1.5">
              {letters.map((l, i) => (
                <span
                  key={i}
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: l ? GAMES[i].accent : '#222',
                    letterSpacing: '0.1em',
                  }}
                >
                  {l || '·'}
                </span>
              ))}
            </div>
          )}

          {/* Result feedback */}
          {result === 'correct' && (
            <div
              className="flex items-center justify-center gap-3 py-3 rounded-lg font-mono text-sm tracking-widest uppercase"
              style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14' }}
            >
              ✓ CODE CORRECT — ACCÈS AUTORISÉ
            </div>
          )}
          {result === 'wrong' && (
            <div
              className="flex items-center justify-center gap-3 py-3 rounded-lg font-mono text-sm tracking-widest uppercase"
              style={{ background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.3)', color: '#ff0040' }}
            >
              ✗ CODE INCORRECT — RÉESSAIE
            </div>
          )}

          {/* Validate button */}
          <button
            disabled={!allFilled}
            onClick={validate}
            className="w-full py-3 font-bold tracking-[0.15em] uppercase rounded-lg transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.95rem',
              color: allFilled ? '#fff' : '#333',
              background: 'transparent',
              border: `1px solid ${allFilled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
              cursor: allFilled ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (allFilled) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = allFilled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'; }}
          >
            VALIDER LE CODE →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Timer helpers ─── */
const TIMER_DURATION = 12 * 60; // 720 seconds

function formatTimer(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function TimerWidget({ timeLeft, running, onToggle, onReset, compact = false }) {
  const danger = timeLeft < 60;
  const warning = timeLeft < 180;
  const color = danger ? '#ff0040' : warning ? '#ffd000' : '#00e5ff';
  const pct = (timeLeft / TIMER_DURATION) * 100;
  const finished = timeLeft === 0;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{
          background: 'rgba(4,4,12,0.9)',
          border: `1px solid ${color}40`,
          boxShadow: `0 0 10px ${color}20`,
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        <span style={{ fontSize: '10px', color: '#444', letterSpacing: '2px' }}>⏱</span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color,
            letterSpacing: '2px',
            textShadow: danger ? `0 0 10px ${color}` : 'none',
            fontFamily: "'Bebas Neue', sans-serif",
          }}
        >
          {formatTimer(timeLeft)}
        </span>
        <button
          onClick={onToggle}
          title={running ? 'Pause' : 'Lancer'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: running ? color : '#555', fontSize: '11px', padding: '0 2px', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = color}
          onMouseLeave={e => e.currentTarget.style.color = running ? color : '#555'}
        >
          {running ? '⏸' : '▶'}
        </button>
        <button
          onClick={onReset}
          title="Reset"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '11px', padding: '0 2px', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >
          ↺
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-5 left-5 z-50 flex flex-col items-center gap-1.5"
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      <div
        className="px-4 py-3 rounded-xl flex flex-col items-center gap-1.5"
        style={{
          background: 'rgba(4,4,12,0.92)',
          border: `1px solid ${color}35`,
          boxShadow: `0 0 20px ${color}15, inset 0 0 20px rgba(0,0,0,0.3)`,
          minWidth: '120px',
        }}
      >
        <span style={{ fontSize: '9px', color: '#444', letterSpacing: '3px', textTransform: 'uppercase' }}>
          {finished ? 'TEMPS ÉCOULÉ' : running ? 'En cours' : 'En pause'}
        </span>
        <span
          style={{
            fontSize: '34px',
            lineHeight: 1,
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '3px',
            color,
            textShadow: danger ? `0 0 16px ${color}` : warning ? `0 0 10px ${color}60` : 'none',
          }}
        >
          {formatTimer(timeLeft)}
        </span>
        {/* Progress bar */}
        <div className="w-full rounded-full mt-0.5" style={{ height: '2px', background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
          />
        </div>
        {/* Controls */}
        <div className="flex gap-2 mt-1 w-full">
          <button
            onClick={onToggle}
            disabled={finished}
            className="flex-1 py-1 rounded text-center transition-all duration-100 cursor-pointer"
            style={{
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: running ? `${color}18` : 'transparent',
              border: `1px solid ${finished ? '#333' : color}50`,
              color: finished ? '#333' : color,
              cursor: finished ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!finished) e.currentTarget.style.background = `${color}28`; }}
            onMouseLeave={e => { e.currentTarget.style.background = running ? `${color}18` : 'transparent'; }}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={onReset}
            className="px-2 py-1 rounded transition-all duration-100 cursor-pointer"
            style={{
              fontSize: '12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#555',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Music Control ─── */
function MusicControl({ audioRef, playing, onToggle, volume, onVolume }) {
  const [expanded, setExpanded] = useState(false);
  const color = '#00e5ff';

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col-reverse items-center gap-2"
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Volume slider — visible on hover */}
      {expanded && (
        <div
          className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(4,4,12,0.92)', border: `1px solid ${color}30`, boxShadow: `0 0 16px ${color}12` }}
        >
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => onVolume(parseFloat(e.target.value))}
            style={{
              writingMode: 'vertical-lr',
              direction: 'rtl',
              height: '70px',
              width: '4px',
              accentColor: color,
              cursor: 'pointer',
            }}
          />
        </div>
      )}

      {/* Main button */}
      <button
        onClick={onToggle}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
        style={{
          background: playing ? `${color}18` : 'rgba(4,4,12,0.92)',
          border: `1px solid ${playing ? color + '50' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: playing ? `0 0 14px ${color}25` : 'none',
          fontSize: '16px',
        }}
        title={playing ? 'Couper la musique' : 'Lancer la musique'}
      >
        {playing ? '♫' : '♩'}
      </button>
    </div>
  );
}

/* ─── Youtube Intro ─── */
function YoutubeIntro({ onEnd }) {
  const [started, setStarted] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!started) return;

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('yt-intro-player', {
        events: {
          onReady: (e) => {
            e.target.setVolume(50);
            e.target.setPlaybackQuality('hd1080');
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === 0) onEnd();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => { delete window.onYouTubeIframeAPIReady; };
  }, [started, onEnd]);

  if (!started) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-6 cursor-pointer"
        onClick={() => setStarted(true)}
      >
        <div className="text-center">
          <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#444', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>✦ challenge 48h ✦</p>
          <button
            className="px-10 py-4 rounded-lg border text-white tracking-widest uppercase text-sm transition-all"
            style={{ fontFamily: "'Share Tech Mono', monospace", background: 'transparent', borderColor: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          >
            ▶ Lancer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <iframe
        id="yt-intro-player"
        src="https://www.youtube.com/embed/a79hQ4HMvFU?autoplay=1&controls=0&rel=0&modestbranding=1&enablejsapi=1&playsinline=1&vq=hd1080"
        allow="autoplay; encrypted-media"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
      <button
        onClick={onEnd}
        className="fixed bottom-8 right-8 text-[0.75rem] tracking-widest uppercase px-4 py-2 rounded border cursor-pointer transition-all"
        style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      >
        Passer →
      </button>
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentGame, setCurrentGame] = useState(null);
  const [devFlash, setDevFlash] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const audioRef = useRef(null);
  const gameAudioRef = useRef(null);
  const bgWasPlayingRef = useRef(false);
  const timerRef = useRef(null);
  const konamiRef = useRef([]);
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

  useEffect(() => {
    const handler = (e) => {
      const seq = [...konamiRef.current, e.key].slice(-KONAMI.length);
      konamiRef.current = seq;
      if (seq.join(',') === KONAMI.join(',')) {
        const v = GAMES.length + 1;
        setUnlockedLevel(v);
        localStorage.setItem('arcadeProgress', v);
        setDevFlash(true);
        setTimeout(() => setDevFlash(false), 1500);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const GAME_MUSIC = {
    rhythm: '/rythme_game.mp3',
    glitch: '/glitch.mp3',
    memory: '/memory_game.mp3',
    quest: '/arrow_quest.mp3',
    mirror: '/mirror.mp3',
    tune: '/son tune switch.mp3',
  };

  useEffect(() => {
    const audio = new Audio('/fond.mp3');
    audio.loop = true;
    audio.volume = musicVolume;
    audioRef.current = audio;
    if (!showIntro) {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
    return () => { audio.pause(); audio.src = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showIntro && audioRef.current) {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  }, [showIntro]);

  useEffect(() => {
    if (!currentGame) return; // lancement initial : la musique de fond gère elle-même son play()

    // Stop any previous game music
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.src = '';
      gameAudioRef.current = null;
    }

    const bgAudio = audioRef.current;
    if (GAME_MUSIC[currentGame]) {
      // Mémoriser si la musique de fond tournait avant d'ouvrir le jeu
      bgWasPlayingRef.current = bgAudio ? !bgAudio.paused : false;
      if (bgAudio) bgAudio.pause();
      const gameAudio = new Audio(GAME_MUSIC[currentGame]);
      gameAudio.loop = true;
      gameAudio.volume = musicVolume;
      gameAudio.play().catch(() => {});
      gameAudioRef.current = gameAudio;
    }

    return () => {
      // Quand on quitte le jeu : arrêter la musique du jeu et relancer le fond si nécessaire
      if (gameAudioRef.current) {
        gameAudioRef.current.pause();
        gameAudioRef.current.src = '';
        gameAudioRef.current = null;
      }
      if (bgAudio && bgWasPlayingRef.current) bgAudio.play().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame]);

  const handleMusicToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio.play();
      setMusicPlaying(true);
    }
  };

  const handleMusicVolume = (v) => {
    setMusicVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (gameAudioRef.current) gameAudioRef.current.volume = v;
  };

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) { clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handleTimerToggle = () => setTimerRunning(r => !r);
  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimeLeft(TIMER_DURATION);
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem('arcadeProgress');
    if (savedProgress) setUnlockedLevel(parseInt(savedProgress, 10));
    setIsLoaded(true);
  }, []);

  const games = [
    { id: 'rhythm', name: 'Jeu de Rythme', component: RhythmGame, description: 'Teste ton sens du rythme' },
    { id: 'glitch', name: 'Control Glitch', component: ControlGlitch, description: 'Maîtrise le contrôle' },
    { id: 'memory', name: 'Memory Game', component: MemoryGame, description: 'Exerce ta mémoire' },
    { id: 'quest', name: 'Quest Game', component: QuestGame, description: 'Embark on a quest' },
    { id: 'mirror', name: 'Mirror Sequence', component: MirrorSequence, description: 'Suis la séquence' },
    { id: 'tune', name: 'Tune Switch', component: TuneSwitch, description: 'Accorde les cordes avant qu\'elles cassent !' }
  ];

  // Fonction à appeler quand un joueur réussit un mini-jeu
  const handleWin = () => {
    const currentIndex = GAMES.findIndex(g => g.id === currentGame);
    if (currentIndex + 2 > unlockedLevel) {
      const newLevel = Math.min(currentIndex + 2, GAMES.length + 1);
      setUnlockedLevel(newLevel);
      localStorage.setItem('arcadeProgress', newLevel);
    }
  };

  /* ── Intro video ── */
  if (showIntro) {
    return <YoutubeIntro onEnd={() => setShowIntro(false)} />;
  }

  if (!isLoaded) return null;

  /* ── In-game view ── */
  if (currentGame) {
    const GameComponent = GAMES.find(g => g.id === currentGame)?.component;
    return (
      <div className="min-h-screen bg-[#05050f] text-white relative">
        {/* Floating timer — top right */}
        <div className="fixed top-4 left-4 z-50">
          <TimerWidget timeLeft={timeLeft} running={timerRunning} onToggle={handleTimerToggle} onReset={handleTimerReset} compact />
        </div>
        <MusicControl audioRef={audioRef} playing={musicPlaying} onToggle={handleMusicToggle} volume={musicVolume} onVolume={handleMusicVolume} />
        <GameComponent onWin={handleWin} onBack={() => setCurrentGame(null)} />
      </div>
    );
  }

  /* ── Menu view ── */
  const progressPct = (unlockedLevel / GAMES.length) * 100;

  return (
    <>
      {devFlash && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center" style={{ background: 'rgba(240,165,0,0.08)', animation: 'none' }}>
          <div className="text-center" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#f0a500', fontSize: '1.1rem', letterSpacing: '0.3em', textTransform: 'uppercase', textShadow: '0 0 20px #f0a500' }}>
            ⚡ ALL UNLOCKED ⚡
          </div>
        </div>
      )}
      <MailboxPanel unlockedLevel={unlockedLevel} />
      <TimerWidget timeLeft={timeLeft} running={timerRunning} onToggle={handleTimerToggle} onReset={handleTimerReset} />
      <MusicControl audioRef={audioRef} playing={musicPlaying} onToggle={handleMusicToggle} volume={musicVolume} onVolume={handleMusicVolume} />
      {/* Global styles injected inline */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap');

        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes titleReveal {
          from { opacity: 0; transform: translateY(-20px) skewY(-1deg); clip-path: inset(0 0 100% 0); }
          to   { opacity: 1; transform: translateY(0) skewY(0); clip-path: inset(0 0 0% 0); }
        }
        @keyframes scanFade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; } to { width: ${progressPct}%; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes float-glyph {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.06; }
          33% { transform: translateY(-18px) rotate(8deg); opacity: 0.1; }
          66% { transform: translateY(10px) rotate(-5deg); opacity: 0.04; }
        }
        .arcade-title {
          font-family: 'Bebas Neue', sans-serif;
          animation: titleReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both 0.1s;
        }
        .credits-bar-fill {
          animation: progressFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) both 0.8s;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center relative overflow-hidden"
        style={{ background: '#05050f', fontFamily: "'Share Tech Mono', monospace" }}
      >
        {/* Animated grid canvas */}
        <div className="absolute inset-0 pointer-events-none">
          <GridCanvas />
        </div>

        {/* Deep vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,5,15,0.85) 100%)',
          }}
        />

        {/* Ambient glows */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,229,255,0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(191,0,255,0.04) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Floating background glyphs */}
        {['⬡', '◈', '⊗', '♩', '⚔', '♪'].map((g, i) => (
          <div
            key={i}
            className="absolute select-none pointer-events-none text-white"
            style={{
              fontSize: `${3 + (i % 3)}rem`,
              left: `${8 + i * 18}%`,
              top: `${15 + (i % 2) * 55}%`,
              animation: `float-glyph ${5 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {g}
          </div>
        ))}

        {/* ── Content ── */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col items-center px-5 py-14 md:py-20">

          {/* System label */}
          <div
            className="text-[10px] tracking-[0.5em] uppercase mb-6 flex items-center gap-3"
            style={{
              color: '#00e5ff',
              animation: 'scanFade 0.5s ease both 0.05s',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e5ff]"
              style={{ animation: 'pulse-dot 1.5s ease-in-out infinite' }}
            />
            SYSTÈME ARCADE · ONLINE
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e5ff]"
              style={{ animation: 'pulse-dot 1.5s ease-in-out infinite 0.75s' }}
            />
          </div>

          {/* Main title */}
          <div className="text-center mb-3">
            <h1
              className="arcade-title text-[5rem] md:text-[8.5rem] leading-none tracking-tight"
              style={{ color: '#ffffff' }}
            >
              ARCADE
            </h1>
            <h1
              className="arcade-title text-[5rem] md:text-[8.5rem] leading-none tracking-tight"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(0,229,255,0.7)',
                animationDelay: '0.18s',
              }}
            >
              GAMES
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className="text-xs tracking-[0.25em] uppercase text-gray-600 mb-14 text-center"
            style={{ animation: 'scanFade 0.6s ease both 0.4s', opacity: 0 }}
          >
            5 mini-jeux · 5 défis · 1 séquence
          </p>

          {/* ── Progress section ── */}
          <div
            className="w-full max-w-sm mb-14 flex flex-col items-center gap-3"
            style={{ animation: 'scanFade 0.6s ease both 0.5s', opacity: 0 }}
          >
            {/* Dots progress */}
            <div className="flex items-center gap-3">
              {GAMES.map((g, i) => (
                <div key={g.id} className="flex items-center gap-3">
                  <div
                    className="transition-all duration-500"
                    style={{
                      width: i < unlockedLevel ? 28 : 10,
                      height: 10,
                      borderRadius: 999,
                      background: i < unlockedLevel ? g.accent : 'rgba(255,255,255,0.08)',
                      boxShadow: i < unlockedLevel ? `0 0 10px ${g.glow}` : 'none',
                    }}
                  />
                  {i < GAMES.length - 1 && (
                    <div
                      className="h-px w-4"
                      style={{
                        background: i < unlockedLevel - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Credits bar */}
            <div className="w-full h-px relative overflow-visible">
              <div className="w-full h-px bg-white/5" />
              <div
                className="credits-bar-fill absolute top-0 left-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, #00e5ff, #bf00ff)',
                  boxShadow: '0 0 8px rgba(0,229,255,0.6)',
                  width: 0,
                }}
              />
            </div>

            <p className="text-[10px] tracking-[0.3em] text-gray-600 uppercase">
              {unlockedLevel} / {GAMES.length} crédits débloqués
            </p>
          </div>

          {/* ── Game cards grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
            {GAMES.map((game, index) => {
              const isUnlocked = index < unlockedLevel;
              const isNextToUnlock = index === unlockedLevel;
              const previousGame = index > 0 ? GAMES[index - 1] : null;

              return (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  isUnlocked={isUnlocked}
                  isNextToUnlock={isNextToUnlock}
                  previousGame={previousGame}
                  onClick={() => isUnlocked && setCurrentGame(game.id)}
                />
              );
            })}
          </div>

          {/* ── Secret Code ── */}
          <SecretCodeSection />

          {/* ── Reset ── */}
          <div className="mt-20 flex items-center gap-4">
            {unlockedLevel > 1 && (
              <button
                onClick={() => { localStorage.removeItem('arcadeProgress'); setUnlockedLevel(1); }}
                className="text-[10px] tracking-widest uppercase transition-colors"
                style={{ color: '#222' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
                onMouseLeave={e => e.currentTarget.style.color = '#222'}
              >
                ↺ Réinitialiser
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

export default function Page() {
  return <App />;
}