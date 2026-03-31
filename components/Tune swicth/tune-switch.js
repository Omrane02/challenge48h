'use client';

import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────

const NUM_STRINGS = 4;       // Number of guitar strings
const GAME_DURATION = 60;    // Total game duration in seconds
const REWARD_LETTER = 'I';   // Fragment shown on victory (part of the final password)

// The keyboard keys mapped to each string
const KEYS = ['A', 'Z', 'E', 'R'];

// Difficulty configuration per level.
// The game has 5 levels, each lasting ~24 seconds.
// redInterval    = how often a random string turns red (ms)
// maxRed         = maximum number of simultaneously red strings
// switchInterval = how often the key mapping is shuffled (ms)
// redTimeout     = how long a string can stay red before game over (ms)
const LEVEL_CONFIG = [
  { redInterval: 3000, maxRed: 1, switchInterval: 15000, redTimeout: 6000 }, // Level 1 - Beginner
  { redInterval: 2500, maxRed: 1, switchInterval: 12000, redTimeout: 5000 }, // Level 2 - Easy
  { redInterval: 2000, maxRed: 2, switchInterval:  9000, redTimeout: 4000 }, // Level 3 - Medium
  { redInterval: 1500, maxRed: 2, switchInterval:  7000, redTimeout: 3200 }, // Level 4 - Hard
  { redInterval: 1000, maxRed: 3, switchInterval:  5000, redTimeout: 2500 }, // Level 5 - Expert
];

const LEVEL_NAMES = ['DÉBUTANT', 'FACILE', 'MOYEN', 'DIFFICILE', 'EXPERT'];

// ── Helper: Fisher-Yates shuffle ───────────────────────────────────────────
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Helper: format seconds to M:SS ────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TuneSwitch({ onWin, onBack }) {

  // ── Screen state: 'idle' | 'playing' | 'win' | 'lose' ───────────────────
  const [screen, setScreen] = useState('idle');

  // strings[i] = 'green' (OK) or 'red' (needs fixing)
  const [strings, setStrings] = useState(Array(NUM_STRINGS).fill('green'));

  // keyMapping[i] = which key is assigned to string i (e.g. 'A', 'Z', 'E', 'R')
  const [keyMapping, setKeyMapping] = useState([...KEYS]);

  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [level, setLevel]       = useState(1);
  const [loseReason, setLoseReason] = useState('');

  // Visual feedback
  const [showSwitch, setShowSwitch]   = useState(false); // "SWITCH!" banner
  const [wrongFlash, setWrongFlash]   = useState(false); // red screen flash on wrong key
  const [fixedIndex, setFixedIndex]   = useState(null);  // index of string just fixed (green flash)

  // ── Refs: needed so timers/callbacks always read the latest values ────────
  const screenRef      = useRef('idle');
  const stringsRef     = useRef(Array(NUM_STRINGS).fill('green'));
  const keyMappingRef  = useRef([...KEYS]);
  const levelRef       = useRef(1);
  const timeLeftRef    = useRef(GAME_DURATION);

  // Per-string game-over timers: if a string stays red too long → lose
  const redTimeoutsRef = useRef({}); // { stringIndex: timeoutId }

  // Scheduling refs
  const countdownRef      = useRef(null);
  const redScheduleRef    = useRef(null);
  const switchScheduleRef = useRef(null);

  useEffect(() => {
    if (screen === 'lose') {
      const audio = new Audio('/game over.mp3');
      audio.play().catch(() => {});
    }
  }, [screen]);

  // ── Keep refs in sync with state ─────────────────────────────────────────
  useEffect(() => { screenRef.current     = screen;     }, [screen]);
  useEffect(() => { stringsRef.current    = strings;    }, [strings]);
  useEffect(() => { keyMappingRef.current = keyMapping; }, [keyMapping]);
  useEffect(() => { levelRef.current      = level;      }, [level]);
  useEffect(() => { timeLeftRef.current   = timeLeft;   }, [timeLeft]);

  // ── Stop every running timer ──────────────────────────────────────────────
  const stopAllTimers = useCallback(() => {
    clearInterval(countdownRef.current);
    clearTimeout(redScheduleRef.current);
    clearTimeout(switchScheduleRef.current);
    Object.values(redTimeoutsRef.current).forEach(clearTimeout);
    redTimeoutsRef.current = {};
  }, []);

  // ── Trigger loss ──────────────────────────────────────────────────────────
  const triggerLose = useCallback((reason) => {
    stopAllTimers();
    screenRef.current = 'lose';
    setScreen('lose');
    setLoseReason(reason);
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 800);
  }, [stopAllTimers]);

  // ── Trigger win ───────────────────────────────────────────────────────────
  const triggerWin = useCallback(() => {
    stopAllTimers();
    screenRef.current = 'win';
    setScreen('win');
    if (onWin) onWin();
  }, [stopAllTimers, onWin]);

  // ── Shuffle key mappings and show "SWITCH!" ───────────────────────────────
  const doSwitch = useCallback(() => {
    const newMapping = shuffleArray(KEYS);
    keyMappingRef.current = newMapping;
    setKeyMapping(newMapping);
    setShowSwitch(true);
    setTimeout(() => setShowSwitch(false), 900);
  }, []);

  // ── Schedule the next key-mapping switch ──────────────────────────────────
  const scheduleNextSwitch = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    const { switchInterval } = LEVEL_CONFIG[levelRef.current - 1];
    switchScheduleRef.current = setTimeout(() => {
      if (screenRef.current !== 'playing') return;
      doSwitch();
      scheduleNextSwitch(); // schedule the one after that
    }, switchInterval);
  }, [doSwitch]);

  // ── Turn a random green string red ───────────────────────────────────────
  const turnStringRed = useCallback(() => {
    const current = stringsRef.current;
    const { maxRed, redTimeout } = LEVEL_CONFIG[levelRef.current - 1];

    // Don't exceed the max simultaneous red strings for this level
    const redCount = current.filter(s => s === 'red').length;
    if (redCount >= maxRed) return;

    // Pick a random green string
    const greenIndices = current.map((s, i) => (s === 'green' ? i : -1)).filter(i => i >= 0);
    if (greenIndices.length === 0) return;

    const idx = greenIndices[Math.floor(Math.random() * greenIndices.length)];

    // Mark it red
    const next = [...current];
    next[idx] = 'red';
    stringsRef.current = next;
    setStrings([...next]);

    // If not fixed within redTimeout → game over
    const tid = setTimeout(() => {
      if (screenRef.current === 'playing' && stringsRef.current[idx] === 'red') {
        triggerLose(`La corde ${idx + 1} n'a pas été accordée à temps !`);
      }
    }, redTimeout);
    redTimeoutsRef.current[idx] = tid;
  }, [triggerLose]);

  // ── Schedule the next red-string event ───────────────────────────────────
  const scheduleNextRed = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    const { redInterval } = LEVEL_CONFIG[levelRef.current - 1];
    redScheduleRef.current = setTimeout(() => {
      if (screenRef.current !== 'playing') return;
      turnStringRed();
      scheduleNextRed(); // schedule the one after that
    }, redInterval);
  }, [turnStringRed]);

  // ── Start (or restart) the game ───────────────────────────────────────────
  const startGame = useCallback(() => {
    stopAllTimers();

    // Reset all state and refs
    const initialMapping = [...KEYS];
    stringsRef.current    = Array(NUM_STRINGS).fill('green');
    keyMappingRef.current = initialMapping;
    levelRef.current      = 1;
    timeLeftRef.current   = GAME_DURATION;
    redTimeoutsRef.current = {};

    setStrings(Array(NUM_STRINGS).fill('green'));
    setKeyMapping(initialMapping);
    setScore(0);
    setLevel(1);
    setTimeLeft(GAME_DURATION);
    setShowSwitch(false);
    setWrongFlash(false);
    setFixedIndex(null);
    setLoseReason('');

    screenRef.current = 'playing';
    setScreen('playing');

    // ── Countdown (every second) ─────────────────────────────────────────
    countdownRef.current = setInterval(() => {
      if (screenRef.current !== 'playing') return;

      const newTime = timeLeftRef.current - 1;
      timeLeftRef.current = newTime;
      setTimeLeft(newTime);

      // Advance level every 24 seconds
      const elapsed  = GAME_DURATION - newTime;
      const newLevel = Math.min(5, Math.floor(elapsed / 12) + 1);
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
      }

      // Time's up → player wins!
      if (newTime <= 0) {
        triggerWin();
      }
    }, 1000);

    // ── Start red-string and switch scheduling ───────────────────────────
    scheduleNextRed();
    scheduleNextSwitch();

  }, [stopAllTimers, scheduleNextRed, scheduleNextSwitch, triggerWin]);

  // ── Handle keyboard input ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screenRef.current !== 'playing') return;

      const key = e.key.toUpperCase();
      if (!KEYS.includes(key)) return;
      e.preventDefault();

      // Find which string this key is currently mapped to
      const mapping    = keyMappingRef.current;
      const stringIdx  = mapping.indexOf(key);
      if (stringIdx === -1) return;

      const current = stringsRef.current;

      if (current[stringIdx] === 'red') {
        // ✅ Correct key! Fix the string.
        clearTimeout(redTimeoutsRef.current[stringIdx]);
        delete redTimeoutsRef.current[stringIdx];

        const next = [...current];
        next[stringIdx] = 'green';
        stringsRef.current = next;
        setStrings([...next]);

        // Award points (more at higher levels)
        const points = 10 * levelRef.current;
        setScore(s => s + points);

        // Brief green flash on the fixed string
        setFixedIndex(stringIdx);
        setTimeout(() => setFixedIndex(null), 400);

      } else {
        // ❌ Wrong! The string was already green → game over
        triggerLose(`Mauvaise touche pressée !`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerLose]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => () => stopAllTimers(), [stopAllTimers]);

  // ── Time-bar progress (0 → 100%) ─────────────────────────────────────────
  const elapsed  = GAME_DURATION - timeLeft;
  const progress = (elapsed / GAME_DURATION) * 100;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <style>{`
      @keyframes ts-fadeUp { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:translateY(0);} }
      .ts-enter    { animation: ts-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      .ts-enter-d1 { animation: ts-fadeUp 0.5s 0.07s cubic-bezier(0.22,1,0.36,1) both; }
      .ts-enter-d2 { animation: ts-fadeUp 0.5s 0.14s cubic-bezier(0.22,1,0.36,1) both; }
      .ts-enter-d3 { animation: ts-fadeUp 0.5s 0.21s cubic-bezier(0.22,1,0.36,1) both; }
      .ts-enter-d4 { animation: ts-fadeUp 0.5s 0.28s cubic-bezier(0.22,1,0.36,1) both; }
    `}</style>
    <div className={`min-h-screen flex flex-col items-center justify-center font-mono transition-colors duration-300 relative overflow-hidden
      ${wrongFlash ? 'bg-red-950' : 'bg-[#0a0a14]'}
    `}>

      {/* ── Background grid ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, #ffffff06 39px, #ffffff06 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, #ffffff06 39px, #ffffff06 40px)
          `
        }}
      />

      {/* ── SWITCH! overlay ── */}
      {showSwitch && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div
            className="text-7xl font-black text-yellow-400 tracking-widest"
            style={{ textShadow: '0 0 40px rgba(250,204,21,0.9), 0 0 80px rgba(250,204,21,0.5)' }}
          >
            SWITCH !
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center gap-6">

        {/* ══════════════════════════════════════════════════════════════════
            IDLE SCREEN
        ══════════════════════════════════════════════════════════════════ */}
        {screen === 'idle' && (
          <>
            {/* Title */}
            <h1 className="ts-enter text-5xl font-black uppercase tracking-widest text-center"
              style={{ background: 'linear-gradient(to right, #facc15, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Tune Switch
            </h1>
            <p className="ts-enter-d1 text-gray-400 text-center text-sm leading-relaxed">
              Accorde les cordes avant qu'elles cassent !<br/>
              Mais attention — les touches changent de place en cours de jeu…
            </p>

            {/* Rules */}
            <div className="ts-enter-d2 w-full bg-gray-900/80 border border-gray-800 rounded-2xl p-5 text-sm space-y-3">
              <p className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 text-lg leading-none">●</span>
                <span><strong className="text-white">Corde verte</strong> — tout va bien, ne touche pas à sa touche !</span>
              </p>
              <p className="flex items-start gap-3 text-gray-300">
                <span className="text-red-400 text-lg leading-none">●</span>
                <span><strong className="text-red-400">Corde rouge</strong> — appuie vite sur sa touche assignée !</span>
              </p>
              <p className="flex items-start gap-3 text-gray-300">
                <span className="text-yellow-400 text-lg leading-none">⚡</span>
                <span><strong className="text-yellow-400">SWITCH!</strong> — les touches sont remélangées aléatoirement</span>
              </p>
              <div className="border-t border-gray-800 pt-3 text-gray-500 text-xs space-y-1">
                <p>❌ Mauvaise touche → game over instantané</p>
                <p>❌ Corde rouge trop longtemps → game over</p>
              </div>
            </div>

            {/* Default key mapping preview */}
            <div className="ts-enter-d3 w-full">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 text-center">
                Touches au départ
              </p>
              <div className="grid grid-cols-4 gap-3">
                {KEYS.map((key, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-full h-10 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center text-xs text-green-400 font-semibold">
                      Corde {i + 1}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center font-black text-white text-xl">
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-black text-2xl uppercase tracking-widest text-black transition-all active:scale-95 hover:brightness-110"
              style={{ background: 'linear-gradient(to right, #facc15, #f97316)' }}
            >
              ▶  Jouer
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#555' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                ← ARCADE
              </button>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PLAYING SCREEN
        ══════════════════════════════════════════════════════════════════ */}
        {screen === 'playing' && (
          <>
            {/* ── HUD ── */}
            <div className="w-full flex justify-between items-center bg-gray-900/80 rounded-2xl px-6 py-3 border border-gray-800">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
                <div className="text-2xl font-black text-yellow-400">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Temps</div>
                <div className={`text-2xl font-black tabular-nums ${timeLeft <= 15 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Niveau</div>
                <div className="text-2xl font-black text-cyan-400">{level}</div>
              </div>
            </div>

            {/* ── Strings ── */}
            <div className="w-full flex flex-col gap-4">
              {strings.map((state, i) => {
                const isRed   = state === 'red';
                const isFixed = fixedIndex === i;
                return (
                  <div key={i} className="flex items-center gap-4">

                    {/* String bar */}
                    <div className={`flex-1 h-16 rounded-2xl flex items-center justify-between px-5 font-bold text-base transition-all duration-200
                      ${isRed
                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.45)]'
                        : isFixed
                          ? 'bg-green-400/25 border-2 border-green-400 text-green-300 shadow-[0_0_24px_rgba(74,222,128,0.45)]'
                          : 'bg-green-500/10 border-2 border-green-500/30 text-green-500/70'
                      }
                    `}>
                      <span className="text-sm tracking-wide">
                        {isRed ? '⚠  ACCORDEZ !' : '♪  OK'}
                      </span>
                      <span className="text-xs opacity-60">Corde {i + 1}</span>
                    </div>

                    {/* Key badge — highlights when string is red */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-all duration-200 select-none
                      ${isRed
                        ? 'bg-red-500 border-red-400 text-white shadow-[0_0_18px_rgba(239,68,68,0.6)] scale-110'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                      }
                    `}>
                      {keyMapping[i]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Progress bar ── */}
            <div className="w-full">
              <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #22d3ee, #a855f7)'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1.5 uppercase tracking-widest">
                <span>Niveau {level} — {LEVEL_NAMES[level - 1]}</span>
                <span>{formatTime(timeLeft)} restant</span>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            WIN SCREEN
        ══════════════════════════════════════════════════════════════════ */}
        {screen === 'win' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="ts-enter text-6xl">🎸</div>
            <h2 className="ts-enter-d1 text-5xl font-black uppercase tracking-widest"
              style={{ background: 'linear-gradient(to right, #facc15, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Bravo !
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu as tenu la minute sans jamais rater une corde.<br/>
              Tu mérites ce fragment de mot de passe.
            </p>

            <div className="text-3xl font-black text-yellow-400">{score} pts</div>

            {/* Reward fragment */}
            <div className="ts-enter-d2 mt-2 px-10 py-5 bg-yellow-500/10 border-2 border-yellow-500 rounded-2xl flex flex-col items-center gap-2">
              <div className="text-xs text-yellow-500/70 uppercase tracking-widest">Fragment débloqué</div>
              <div className="text-7xl font-black text-yellow-400" style={{ letterSpacing: '14px' }}>
                {REWARD_LETTER}
              </div>
              <div className="text-xs text-yellow-600/60 uppercase tracking-widest">Note-le bien !</div>
            </div>

            <button
              onClick={() => setScreen('idle')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm uppercase tracking-widest"
            >
              ← Retour au menu
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#555' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                ← ARCADE
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LOSE SCREEN
        ══════════════════════════════════════════════════════════════════ */}
        {screen === 'lose' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="ts-enter text-6xl">💥</div>
            <h2 className="ts-enter-d1 text-5xl font-black uppercase tracking-widest text-red-500">
              Game Over
            </h2>
            <p className="ts-enter-d2 text-gray-400 text-sm px-4 leading-relaxed">{loseReason}</p>

            <div className="ts-enter-d2 flex gap-8 mt-1">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
                <div className="text-2xl font-black text-white">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Niveau</div>
                <div className="text-2xl font-black text-cyan-400">{level}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Temps</div>
                <div className="text-2xl font-black text-gray-300">{formatTime(timeLeft)}</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3 rounded-xl font-black text-lg uppercase tracking-widest text-black transition-all active:scale-95 hover:brightness-110 mt-2"
              style={{ background: 'linear-gradient(to right, #facc15, #f97316)' }}
            >
              ↺  Réessayer
            </button>
            <button
              onClick={() => setScreen('idle')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm uppercase tracking-widest"
            >
              ← Retour au menu
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#555' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                ← ARCADE
              </button>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
