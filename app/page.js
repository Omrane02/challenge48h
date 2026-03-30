'use client';

import { useState, useEffect, useRef } from 'react';
import RhythmGame from "../components/rythme-game/jeu_rythme";
import ControlGlitch from "@/components/control-glitch/control-glitch";
import MemoryGame from "@/components/memory-game/memory-game";
import QuestGame from "@/components/quest-game/QuestGame";
import MirrorSequence from "@/components/mirror-game/mirror";

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
  },
];

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

/* ─── Main App ─── */
function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProgress = localStorage.getItem('arcadeProgress');
    if (savedProgress) setUnlockedLevel(parseInt(savedProgress, 10));
    setIsLoaded(true);
  }, []);

  const games = [
    { id: 'rhythm', name: 'Jeu de Rythme', component: RhythmGame, description: 'Teste ton sens du rythme', image: 'rythme' },
    { id: 'glitch', name: 'Control Glitch', component: ControlGlitch, description: 'Maîtrise le contrôle', image: 'glitch' },
    { id: 'memory', name: 'Memory Game', component: MemoryGame, description: 'Exerce ta mémoire', image: 'mind' },
    { id: 'quest', name: 'Quest Game', component: QuestGame, description: 'Embark on a quest', image: 'carte' },
    { id: 'mirror', name: 'Mirror Sequence', component: MirrorSequence, description: 'Suis la séquence', image: 'mirroir' }
  ];

  // Fonction à appeler quand un joueur réussit un mini-jeu
  const handleWin = () => {
    const currentIndex = GAMES.findIndex(g => g.id === currentGame);
    if (currentIndex + 2 > unlockedLevel) {
      const newLevel = Math.min(currentIndex + 2, GAMES.length);
      setUnlockedLevel(newLevel);
      localStorage.setItem('arcadeProgress', newLevel);
    }
  };

  if (!isLoaded) return null;

  /* ── In-game view ── */
  if (currentGame) {
    const GameComponent = GAMES.find(g => g.id === currentGame)?.component;
    const game = GAMES.find(g => g.id === currentGame);
    return (
      <div className="min-h-screen bg-[#05050f] text-white flex flex-col">
        <div
          className="px-5 py-3 flex justify-between items-center border-b"
          style={{ borderColor: `${game.accent}20`, background: 'rgba(4,4,12,0.95)' }}
        >
          <button
            onClick={() => setCurrentGame(null)}
            className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase transition-colors"
            style={{ color: '#555' }}
            onMouseEnter={e => e.currentTarget.style.color = game.accent}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            ← ARCADE
          </button>
          <span
            className="font-mono text-xs tracking-[0.3em] uppercase"
            style={{ color: game.accent }}
          >
            {game.tag}
          </span>
          <button
            onClick={handleWin}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded border transition-all"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#444',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = game.accent; e.currentTarget.style.color = game.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#444'; }}
          >
            [Dev] Win
          </button>
        </div>
        <div className="flex-grow relative">
          <GameComponent onWin={handleWin} />
        </div>
      </div>
    );
  }

  /* ── Menu view ── */
  const progressPct = (unlockedLevel / GAMES.length) * 100;

  return (
    <>
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
        {['⬡', '◈', '⊗', '♩', '⚔'].map((g, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
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

          {/* ── Reset ── */}
          {unlockedLevel > 1 && (
            <button
              onClick={() => { localStorage.removeItem('arcadeProgress'); setUnlockedLevel(1); }}
              className="mt-20 text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: '#222' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
              onMouseLeave={e => e.currentTarget.style.color = '#222'}
            >
              ↺ Réinitialiser la progression
            </button>
          )}
        </div>
        
        {/* Grille des jeux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 w-full">
          {games.map((game, index) => {
            const isUnlocked = index < unlockedLevel;
            const isNextToUnlock = index === unlockedLevel;
            const previousGame = index > 0 ? games[index - 1] : null;

            return (
              <button
                key={game.id}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && setCurrentGame(game.id)}
                className={`relative flex flex-col h-[320px] rounded-2xl p-5 transition-all duration-300 text-left overflow-hidden group
                    ${isUnlocked 
                        ? 'bg-gray-800/80 border border-purple-500/30 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:border-purple-400 cursor-pointer' 
                        : 'bg-gray-900/60 border border-gray-800/50 cursor-not-allowed'
                    }
                `}
              >
                {/* Contenu de la carte */}
                <div className="z-10 flex flex-col h-full w-full">
                    
                    {/* Zone Visuelle / Image */}
                    <div className={`h-28 w-full rounded-xl mb-4 flex items-center justify-center overflow-hidden shadow-inner relative
                        ${isUnlocked ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80' : 'bg-gray-950/80'}
                    `}>
                         {isUnlocked ? (
                            <img 
                                src={`/${game.image}.png`}
                                alt={game.name}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                         ) : null}
                         <div className="w-full h-full items-center justify-center text-4xl hidden" style={{display: isUnlocked ? 'none' : 'flex'}}>
                             🔒
                         </div>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 transition-colors ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                      {game.name}
                    </h3>

                    {isUnlocked ? (
                        <>
                            <p className="text-gray-400 text-sm flex-grow line-clamp-2">
                              {game.description}
                            </p>
                            <div className="mt-auto pt-4">
                                <span className="inline-block w-full text-center py-2.5 bg-white text-gray-900 font-bold rounded-lg text-sm group-hover:bg-cyan-300 group-hover:shadow-[0_0_15px_rgba(103,232,249,0.5)] transition-all">
                                    COMMENCER
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center items-center text-center px-2">
                            <p className="text-yellow-500/70 font-bold text-xs uppercase tracking-wider mb-2">
                                Jeu Verrouillé
                            </p>
                            {isNextToUnlock && previousGame ? (
                                <p className="text-gray-500 text-xs">
                                    Réussis le <br/><span className="text-gray-400 font-semibold mt-1 inline-block">"{previousGame.name}"</span><br/> pour débloquer
                                </p>
                            ) : (
                                <p className="text-gray-600 text-xs">Progresse dans l'arcade pour y accéder</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Effet de survol brillant pour les jeux débloqués */}
                {isUnlocked && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-purple-500/5 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bouton pour réinitialiser la progression (Optionnel) */}
        {unlockedLevel > 1 && (
           <button 
             onClick={() => { localStorage.removeItem('arcadeProgress'); setUnlockedLevel(1); }}
             className="mt-16 text-xs text-gray-600 hover:text-red-400 transition-colors"
           >
             Réinitialiser ma progression
           </button>
        )}

      </div>
    </>
  );
}

export default function Page() {
  return <App />;
}