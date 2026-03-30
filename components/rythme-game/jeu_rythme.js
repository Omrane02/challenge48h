'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const GAME_WIDTH    = 400;
const GAME_HEIGHT   = 600;
const LANE_COUNT    = 4;
const LANE_WIDTH    = GAME_WIDTH / LANE_COUNT;
const RECEPTOR_Y    = 510;
const ARROW_SIZE    = 56;
const SPEED_START   = 220;
const SPEED_END     = 700;
const HIT_WINDOW    = 450;
const MISS_LIMIT    = 3;
const HITS_PER_LIFE = 8;
const GAME_DURATION = 120;
const SECRET_LETTER = 'I';
const GRACE_MS      = 1000;

const TRAVEL_DISTANCE = RECEPTOR_Y + ARROW_SIZE;
const START_TRAVEL_MS = (TRAVEL_DISTANCE / SPEED_START) * 1000;

function getSpeed(elapsed) {
  // Accelerates quickly — most of the ramp happens in the first half of the game
  const t = Math.min(1, Math.max(0, elapsed / (GAME_DURATION * 1000)));
  return SPEED_START + (SPEED_END - SPEED_START) * Math.pow(t, 0.45);
}

const LANES = [
  { key: 'ArrowLeft',  color: '#FF6B9D', label: '←', altKey: 'F' },
  { key: 'ArrowDown',  color: '#6BC5FF', label: '↓', altKey: 'G' },
  { key: 'ArrowUp',    color: '#A8FF6B', label: '↑', altKey: 'J' },
  { key: 'ArrowRight', color: '#FFD96B', label: '→', altKey: 'K' },
];

const KEY_TO_LANE = {
  ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3,
  f: 0, g: 1, j: 2, k: 3,
  F: 0, G: 1, J: 2, K: 3,
};

// ── SVG Arrow ─────────────────────────────────────────────────────────────────
function ArrowSVG({ direction, color, size = 56, opacity = 1 }) {
  const paths = {
    ArrowLeft:  'M 42,10 L 14,28 L 42,46 L 42,38 L 26,28 L 42,18 Z',
    ArrowRight: 'M 14,10 L 42,28 L 14,46 L 14,38 L 30,28 L 14,18 Z',
    ArrowUp:    'M 10,42 L 28,14 L 46,42 L 38,42 L 28,26 L 18,42 Z',
    ArrowDown:  'M 10,14 L 28,42 L 46,14 L 38,14 L 28,30 L 18,14 Z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ opacity, display: 'block' }}>
      <path d={paths[direction]} fill={color} />
    </svg>
  );
}

// ── Note chart ────────────────────────────────────────────────────────────────
function generateChart() {
  const BEAT   = 500;
  const EIGHTH = 250;

  const patterns = [
    // 0: 4 croches simples
    [[0,0],[BEAT,1],[BEAT*2,2],[BEAT*3,3]],
    // 1: 5 notes avec double croche
    [[0,0],[BEAT,1],[BEAT+EIGHTH,2],[BEAT*2,3],[BEAT*3,0]],
    // 2: alternance 4 notes
    [[0,1],[BEAT,0],[BEAT*2,3],[BEAT*3,2]],
    // 3: 6 notes — doubles croches en début de mesure
    [[0,0],[EIGHTH,1],[BEAT,2],[BEAT+EIGHTH,3],[BEAT*2,0],[BEAT*3,1]],
    // 4: 7 notes — très dense
    [[0,2],[EIGHTH,3],[BEAT,0],[BEAT*2,1],[BEAT*2+EIGHTH,2],[BEAT*3,3],[BEAT*3+EIGHTH,0]],
    // 5: 8 notes — doubles croches tout du long
    [[0,0],[EIGHTH,1],[BEAT,2],[BEAT+EIGHTH,3],[BEAT*2,0],[BEAT*2+EIGHTH,1],[BEAT*3,2],[BEAT*3+EIGHTH,3]],
  ];

  const sequence = [
    // 0–8s : intro douce (4 mesures)
    0, 2, 0, 2,
    // 8–24s : moderate (8 mesures)
    0, 1, 2, 0, 1, 2, 0, 1,
    // 24–40s : ça monte (8 mesures)
    1, 3, 1, 3, 2, 3, 1, 3,
    // 40–60s : medium-hard (10 mesures)
    3, 1, 3, 3, 3, 1, 3, 3, 3, 3,
    // 60–80s : hard (10 mesures)
    3, 4, 3, 4, 4, 3, 4, 3, 4, 4,
    // 80–100s : très dur (10 mesures)
    4, 4, 5, 4, 5, 4, 4, 5, 4, 5,
    // 100–120s : brutal (10 mesures)
    5, 4, 5, 5, 5, 4, 5, 5, 5, 5,
  ];

  const PATTERN_DURATION = BEAT * 4;
  let id = 0;
  const notes = [];

  sequence.forEach((pi, si) => {
    const startMs = si * PATTERN_DURATION;
    patterns[pi].forEach(([offset, lane]) => {
      const hitTime = startMs + offset;
      if (hitTime < GAME_DURATION * 1000) {
        notes.push({ id: id++, lane, hitTime });
      }
    });
  });

  return notes.sort((a, b) => a.hitTime - b.hitTime);
}

const CHART = generateChart();

// ── Component ─────────────────────────────────────────────────────────────────
export default function RhythmGame() {
  const [gameState,  setGameState]  = useState('idle');
  const [score,      setScore]      = useState(0);
  const [misses,     setMisses]     = useState(0);
  const [combo,      setCombo]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(GAME_DURATION);
  const [feedback,   setFeedback]   = useState(null);
  const [activeKeys, setActiveKeys] = useState({});
  const [grace,      setGrace]      = useState(false);
  const [, forceRender]             = useState(0);

  const arrowsRef        = useRef([]);
  const nextNoteIdxRef   = useRef(0);
  const missesRef        = useRef(0);
  const scoreRef         = useRef(0);
  const comboRef         = useRef(0);
  const hitsForLifeRef   = useRef(0);
  const gameStartRef       = useRef(null);
  const rafRef             = useRef(null);
  const feedbackTimerRef   = useRef(null);
  const activeRef          = useRef(false);
  const lastWrongPressRef  = useRef(0);

  const showFeedback = useCallback((text, lane) => {
    setFeedback({ text, lane });
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 300);
  }, []);

  const gameLoop = useCallback(() => {
    if (!activeRef.current) return;

    const elapsed   = performance.now() - gameStartRef.current;
    const remaining = Math.min(GAME_DURATION, Math.max(0, GAME_DURATION - elapsed / 1000));
    setTimeLeft(Math.ceil(remaining));
    setGrace(elapsed < 0);

    if (elapsed >= GAME_DURATION * 1000) {
      activeRef.current = false;
      setGameState('win');
      return;
    }

    // Current speed & travel time
    const speed      = getSpeed(elapsed);
    const travelTime = (TRAVEL_DISTANCE / speed) * 1000;

    // Spawn arrows
    while (
      nextNoteIdxRef.current < CHART.length &&
      CHART[nextNoteIdxRef.current].hitTime - elapsed <= travelTime
    ) {
      const note = CHART[nextNoteIdxRef.current++];
      arrowsRef.current.push({ ...note, status: 'active' });
    }

    // Move arrows & detect misses
    let hitMissLimit = false;
    arrowsRef.current = arrowsRef.current.filter(arrow => {
      if (arrow.status !== 'active') return false;

      const timeToHit = arrow.hitTime - elapsed;
      arrow.y = RECEPTOR_Y - (timeToHit * speed) / 1000;

      if (arrow.y > RECEPTOR_Y + ARROW_SIZE) {
        missesRef.current += 1;
        comboRef.current   = 0;
        hitsForLifeRef.current = 0;
        setMisses(missesRef.current);
        setCombo(0);
        showFeedback('MISS', arrow.lane);
        if (missesRef.current >= MISS_LIMIT) hitMissLimit = true;
        return false;
      }

      return arrow.y > -ARROW_SIZE - 10;
    });

    if (hitMissLimit) {
      activeRef.current = false;
      setGameState('gameover');
      return;
    }

    forceRender(n => n + 1);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [showFeedback]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    arrowsRef.current      = [];
    nextNoteIdxRef.current = 0;
    missesRef.current      = 0;
    scoreRef.current       = 0;
    comboRef.current       = 0;
    hitsForLifeRef.current = 0;
    setScore(0);
    setMisses(0);
    setCombo(0);
    setFeedback(null);
    setActiveKeys({});
    setTimeLeft(GAME_DURATION);
    setGrace(true);
    
    lastWrongPressRef.current = 0;
    gameStartRef.current = performance.now() + START_TRAVEL_MS + GRACE_MS;
    activeRef.current    = true;
    setGameState('playing');
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const onKeyDown = (e) => {
      const lane = KEY_TO_LANE[e.key];
      if (lane === undefined) return;
      e.preventDefault();

      setActiveKeys(prev => ({ ...prev, [lane]: true }));

      const elapsed = performance.now() - gameStartRef.current;

      let best = null;
      let bestDiff = Infinity;
      for (const arrow of arrowsRef.current) {
        if (arrow.lane !== lane || arrow.status !== 'active') continue;
        const diff = Math.abs(arrow.hitTime - elapsed);
        if (diff < HIT_WINDOW && diff < bestDiff) {
          bestDiff = diff;
          best     = arrow;
        }
      }

      if (best) {
        best.status = 'hit';
        comboRef.current     += 1;
        hitsForLifeRef.current += 1;
        const pts = 100 + Math.floor(comboRef.current / 5) * 50;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setCombo(comboRef.current);

        if (hitsForLifeRef.current % HITS_PER_LIFE === 0 && missesRef.current > 0) {
          missesRef.current -= 1;
          setMisses(missesRef.current);
          showFeedback('+VIE !', lane);
        } else {
          let label = 'GOOD!';
          if (bestDiff < 80) label = 'PERFECT!';
          else if (bestDiff < 200) label = 'GREAT!';
          showFeedback(label, lane);
        }
      } else {
        // Wrong press — no arrow in window
        const now = performance.now();
        const inGrace = (now - gameStartRef.current) < 0;
        if (!inGrace && now - lastWrongPressRef.current > 400) {
          lastWrongPressRef.current = now;
          missesRef.current += 1;
          comboRef.current = 0;
          hitsForLifeRef.current = 0;
          setMisses(missesRef.current);
          setCombo(0);
          showFeedback('MISS', lane);
          if (missesRef.current >= MISS_LIMIT) {
            activeRef.current = false;
            setGameState('gameover');
          }
        }
      }
    };

    const onKeyUp = (e) => {
      const lane = KEY_TO_LANE[e.key];
      if (lane === undefined) return;
      setActiveKeys(prev => ({ ...prev, [lane]: false }));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, [gameState, showFeedback]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const mins      = Math.floor(timeLeft / 60);
  const secs      = String(timeLeft % 60).padStart(2, '0');
  const danger    = timeLeft < 30;
  const livesLeft = MISS_LIMIT - misses;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#050000] font-[Segoe_UI,monospace]">
      <div className="flex flex-col items-center gap-4">
      <div
        className="relative bg-gradient-to-b from-[#100000] to-[#060000] border-2 border-[#3a0000] rounded-[10px] overflow-hidden shadow-[0_0_50px_rgba(180,0,0,0.35)]"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >

        {/* ── HUD ── */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center py-2 px-[14px] bg-black/55 z-[20]">
          <span className="text-[#ddd] text-[13px]">⭐ {score.toLocaleString()}</span>
          <span 
            className={`text-[18px] font-bold ${danger ? 'text-[#ff5555]' : 'text-white'}`}
          >
            {mins}:{secs}
          </span>
          <span className="text-[#ddd] text-[13px]">
            {'❤️'.repeat(Math.max(0, livesLeft))}{'🖤'.repeat(Math.max(0, misses))}
          </span>
        </div>

        {/* ── Combo ── */}
        {combo > 2 && gameState === 'playing' && !grace && (
          <div className="absolute top-9 left-1/2 -translate-x-1/2 text-[#FF3333] text-[15px] font-bold z-[15] whitespace-nowrap [text-shadow:0_0_10px_#FF3333]">
            {combo}× COMBO
          </div>
        )}

        {/* ── Lane backgrounds ── */}
        <div className="absolute inset-0 flex">
          {LANES.map((_l, i) => (
            <div 
              key={i} 
              className="flex-1" 
              style={{ borderRight: i < 3 ? '1px solid #1e0000' : 'none' }}
            />
          ))}
        </div>

        {/* ── Hit line ── */}
        <div 
          className="absolute left-0 right-0 h-[2px] bg-white/5 z-[5]" 
          style={{ top: RECEPTOR_Y }} 
        />

        {/* ── Receptors ── */}
        {LANES.map((lane, i) => (
          <div
            key={i}
            className="absolute border-2 rounded-lg flex items-center justify-center z-[10] transition-[box-shadow,background-color] duration-75"
            style={{
              width:           ARROW_SIZE,
              height:          ARROW_SIZE,
              left:            i * LANE_WIDTH + (LANE_WIDTH - ARROW_SIZE) / 2,
              top:             RECEPTOR_Y - ARROW_SIZE / 2,
              borderColor:     lane.color,
              backgroundColor: activeKeys[i] ? lane.color + '33' : 'transparent',
              boxShadow:       activeKeys[i] ? `0 0 18px ${lane.color}` : 'none',
            }}
          >
            <ArrowSVG
              direction={lane.key}
              color={lane.color}
              size={ARROW_SIZE - 10}
              opacity={activeKeys[i] ? 1 : 0.35}
            />
          </div>
        ))}

        {/* ── Falling arrows ── */}
        {gameState === 'playing' && arrowsRef.current
          .filter(a => a.status === 'active' && a.y !== undefined)
          .map(arrow => (
            <div
              key={arrow.id}
              className="absolute pointer-events-none z-[8]"
              style={{
                left:          arrow.lane * LANE_WIDTH + (LANE_WIDTH - ARROW_SIZE) / 2,
                top:           arrow.y - ARROW_SIZE / 2,
                width:         ARROW_SIZE,
                height:        ARROW_SIZE,
                filter:        `drop-shadow(0 0 7px ${LANES[arrow.lane].color})`,
              }}
            >
              <ArrowSVG direction={LANES[arrow.lane].key} color={LANES[arrow.lane].color} size={ARROW_SIZE} />
            </div>
          ))
        }

        {/* ── Feedback pop ── */}
        {feedback && (
          <div 
            className="absolute font-bold pointer-events-none z-[25] whitespace-nowrap tracking-[1px] [text-shadow:0_0_8px_currentColor] -translate-x-1/2 text-[15px]"
            style={{
              top:   RECEPTOR_Y - 90,
              left:  feedback.lane * LANE_WIDTH + LANE_WIDTH / 2,
              color: feedback.text === 'MISS'    ? '#FF1111' :
                     feedback.text === '+VIE !'  ? '#FF6666' :
                     feedback.text === 'PERFECT!'? '#FFFFFF'  : '#FF9999',
            }}
          >
            {feedback.text}
          </div>
        )}

        {/* ── Grace period banner ── */}
        {gameState === 'playing' && grace && (
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF2222] text-[32px] font-bold z-[15] whitespace-nowrap tracking-[4px] [text-shadow:0_0_20px_#FF2222]">
            PRÊT…
          </div>
        )}

        {/* ── Screen: idle ── */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center z-[100] gap-3.5">
            <h1 className="text-[#FF0000] text-[44px] font-bold m-0 [text-shadow:0_0_25px_#FF0000] tracking-[5px]">
              RHYTHM RUSH
            </h1>
            <p className="text-[#ccc] text-[15px] m-0 text-center px-5">
              Survivez 2 minutes pour révéler la lettre secrète !
            </p>
            <div className="flex gap-5 mt-1">
              {LANES.map((l, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <ArrowSVG direction={l.key} color={l.color} size={34} />
                  <span className="text-[11px] font-mono" style={{ color: l.color }}>
                    {l.altKey} / {l.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[#cc3333] text-[13px] m-0">
              {MISS_LIMIT} vies · appuyer à vide = -1 vie · +1 vie tous les {HITS_PER_LIFE} hits
            </p>
            <button
              className="mt-2 py-3 px-9 text-[18px] font-bold bg-[#990000] text-white border-none rounded-lg cursor-pointer tracking-[2px] shadow-[0_0_20px_rgba(180,0,0,0.6)] transition-transform active:scale-95"
              onClick={startGame}
            >
              ▶ JOUER
            </button>
          </div>
        )}

        {/* ── Screen: gameover ── */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center z-[100] gap-3.5">
            <h2 className="text-[#FF0000] text-[38px] m-0 [text-shadow:0_0_30px_#FF0000]">
              GAME OVER
            </h2>
            <p className="text-[#ccc] text-[18px] m-0">Score : {score.toLocaleString()}</p>
            <p className="text-[#666] text-[14px] m-0">Trop de fautes…</p>
            <button
              className="mt-2 py-3 px-9 text-[18px] font-bold bg-[#990000] text-white border-none rounded-lg cursor-pointer tracking-[2px] shadow-[0_0_20px_rgba(180,0,0,0.6)] transition-transform active:scale-95"
              onClick={startGame}
            >
              RECOMMENCER
            </button>
          </div>
        )}

        {/* ── Screen: win ── */}
        {gameState === 'win' && (
          <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center z-[100] gap-3.5">
            <h2 className="text-white text-[38px] m-0 [text-shadow:0_0_20px_rgba(255,255,255,0.6)]">
              VICTOIRE !
            </h2>
            <p className="text-[#ccc] text-[18px] m-0">Score : {score.toLocaleString()}</p>
            <p className="text-[#888] text-[14px] m-0">Tu as survécu aux 2 minutes !</p>
            <div className="border-2 border-[#FF0000] rounded-[14px] py-3.5 px-9 text-center shadow-[0_0_24px_rgba(255,0,0,0.4)] mt-2">
              <p className="text-[#888] text-[13px] m-0 mb-2">Lettre secrète :</p>
              <span className="text-[#FF0000] text-[72px] font-bold [text-shadow:0_0_24px_#FF0000] block leading-none">
                {SECRET_LETTER}
              </span>
            </div>
            <button
              className="mt-4 py-3 px-9 text-[18px] font-bold bg-[#990000] text-white border-none rounded-lg cursor-pointer tracking-[2px] shadow-[0_0_20px_rgba(180,0,0,0.6)] transition-transform active:scale-95"
              onClick={startGame}
            >
              REJOUER
            </button>
          </div>
        )}

      </div>

      {/* ── Key legend (below game frame) ── */}
      <div className="flex gap-5 justify-center">
        {LANES.map((lane, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 border-2 rounded-[6px] flex items-center justify-center text-[14px] font-bold bg-white/5"
              style={{ borderColor: lane.color, color: lane.color }}
            >
              {lane.altKey}
            </div>
            <div
              className="w-8 h-8 border-2 rounded-[6px] flex items-center justify-center text-[14px] font-bold bg-white/5"
              style={{ borderColor: lane.color, color: lane.color }}
            >
              {lane.label}
            </div>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}