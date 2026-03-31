'use client';

import { useState, useEffect, useRef, useCallback } from "react";

const ARROWS = ['up', 'down', 'left', 'right'];
const GLYPH  = { up: '↑', down: '↓', left: '←', right: '→' };
const COLOR  = { up: '#e0e0e0', down: '#39ff14', left: '#2db80d', right: '#888888' };
const MAX_ROUNDS = 12;
const MIN_ROUND_FOR_FRAGMENT = 6;
const PASSWORD_FRAGMENT = 'K';

function getDelay(round) {
  return Math.round(900 - (round - 1) * (680 / 11));
}

function randomSequence(len) {
  const seq = [];
  for (let i = 0; i < len; i++) {
    let last = seq[i - 1];
    let next;
    do {
      next = ARROWS[Math.floor(Math.random() * 4)];
    } while (next === last);
    seq.push(next);
  }
  return seq;
}

const minimalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap');

  .animate-shake { animation: ms-shake 0.35s ease; }
  @keyframes ms-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-6px); }
    80%     { transform: translateX(6px); }
  }

  @keyframes ms-fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
  .ms-enter    { animation: ms-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .ms-enter-d1 { animation: ms-fadeUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
  .ms-enter-d2 { animation: ms-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
  .ms-enter-d3 { animation: ms-fadeUp 0.5s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
`;

export default function MirrorSequence({ onWin, onBack }) {
  const [screen, setScreen]       = useState('idle');
  const [round, setRound]         = useState(1);
  const [best, setBest]           = useState(0);
  const [sequence, setSequence]   = useState([]);
  const [inputIdx, setInputIdx]   = useState(0);
  const [slots, setSlots]         = useState([]);
  const [countdown, setCountdown] = useState('');
  const [arrowDisplay, setArrowDisplay] = useState({ glyph: '?', color: '#ddd', flashColor: '#e0e0e0' });
  const [resultBadge, setResultBadge]   = useState({ text: '', cls: '' });
  const [resultDetail, setResultDetail] = useState(null);
  const [resultBtnText, setResultBtnText] = useState('');
  const [gameOver, setGameOver]   = useState(false);
  const [shaking, setShaking]     = useState(false);

  const seqRef      = useRef([]);
  const inputIdxRef = useRef(0);
  const roundRef    = useRef(1);
  const gameOverRef = useRef(false);
  const bestRef     = useRef(0);

  useEffect(() => { seqRef.current = sequence; }, [sequence]);
  useEffect(() => { inputIdxRef.current = inputIdx; }, [inputIdx]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { bestRef.current = best; }, [best]);

  const startGame = useCallback(() => {
    roundRef.current = 1;
    setRound(1);
    gameOverRef.current = false;
    setGameOver(false);
    startRound(1);
  }, []);

  const startRound = useCallback((r) => {
    const seq = randomSequence(r);
    seqRef.current = seq;
    setSequence(seq);
    inputIdxRef.current = 0;
    setInputIdx(0);
    playSequence(seq, r);
  }, []);

  const beginInput = useCallback((seq) => {
    setScreen('input');
    setSlots(seq.map((_, idx) => ({ glyph: '', color: '', state: idx === 0 ? 'current' : 'pending' })));
    inputIdxRef.current = 0;
    setInputIdx(0);
  }, []);

  const playSequence = useCallback((seq, r) => {
    setScreen('watch');
    setArrowDisplay({ glyph: '?', color: '#ddd', flashColor: '#e0e0e0' });
    const delay = getDelay(r);
    
    let i = 0;
    function showNext() {
      if (i < seq.length) {
        const dir = seq[i];
        setArrowDisplay({ glyph: GLYPH[dir], color: COLOR[dir], flashColor: COLOR[dir] });
        
        // MODIFICATION : Affiche le décompte uniquement s'il reste plus d'une flèche après celle-ci
        const remaining = seq.length - (i + 1);
        if (remaining > 0) {
          setCountdown(`${remaining} restante${remaining > 1 ? 's' : ''}`);
        } else {
          setCountdown(''); // Vide pour la dernière flèche
        }
        
        i++;
        setTimeout(showNext, delay);
      } else {
        beginInput(seq);
      }
    }
    showNext();
  }, [beginInput]);

  const handleArrow = useCallback((dir) => {
    const seq = seqRef.current;
    const idx = inputIdxRef.current;
    if (idx >= seq.length) return;
    new Audio('/select card.mp3').play().catch(() => {});

    const correct = seq[idx];
    const g = GLYPH[dir];
    const c = COLOR[dir];

    if (dir === correct) {
      setSlots(prev => prev.map((s, i) => {
        if (i === idx) return { glyph: g, color: c, state: 'correct' };
        if (i === idx + 1) return { ...s, state: 'current' };
        return s;
      }));
      const nextIdx = idx + 1;
      inputIdxRef.current = nextIdx;
      setInputIdx(nextIdx);
      if (nextIdx === seq.length) {
        setTimeout(() => triggerPass(), 300);
      }
    } else {
      setSlots(prev => prev.map((s, i) => i === idx ? { glyph: g, color: c, state: 'wrong' } : s));
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      setTimeout(() => triggerFail(), 500);
    }
  }, []);

  const triggerPass = useCallback(() => {
    new Audio('/card success.mp3').play().catch(() => {});
    const r = roundRef.current;
    const seq = seqRef.current;
    const b = bestRef.current;
    const newBest = r > b ? r : b;
    if (r > b) { setBest(newBest); bestRef.current = newBest; }

    const unlocked = r >= MIN_ROUND_FOR_FRAGMENT;
    const fragmentEl = unlocked
      ? (
        <>
          <div className="mt-4 py-3 px-5 text-center" style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.4)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '6px', color: '#39ff14', textShadow: '0 0 12px rgba(57,255,20,0.5)' }}>
            {PASSWORD_FRAGMENT}
          </div>
          <div className="text-[10px] tracking-[2px] mt-1.5 text-center" style={{ color: '#444' }}>
            FRAGMENT DE MOT DE PASSE DÉBLOQUÉ
          </div>
        </>
      ) : (
        <div className="mt-2 text-[11px] text-[#999] tracking-[1px] text-center">
          Atteins la manche 8 pour débloquer un fragment de mot de passe.
        </div>
      );

    if (r === MAX_ROUNDS) {
      setResultBadge({ text: 'VICTOIRE', cls: 'win' });
      setResultDetail(<>Félicitations, tu as terminé les {MAX_ROUNDS} manches !{fragmentEl}</>);
      setResultBtnText('REJOUER');
      gameOverRef.current = true;
      setGameOver(true);
    } else {
      setResultBadge({ text: 'RÉUSSI', cls: 'win' });
      setResultDetail(<>Manche {r} terminée avec succès.{fragmentEl}</>);
      setResultBtnText('MANCHE SUIVANTE');
      roundRef.current = r + 1;
      setRound(r + 1);
      gameOverRef.current = false;
      setGameOver(false);
      if (r === MIN_ROUND_FOR_FRAGMENT && onWin) onWin();
    }
    setScreen('result');
  }, []);

  const triggerFail = useCallback(() => {
    new Audio('/game over.mp3').play().catch(() => {});
    const r = roundRef.current;
    const seq = seqRef.current;
    const hint = r < MIN_ROUND_FOR_FRAGMENT
      ? <><br/><br/><span className="text-[#999] text-[11px]">Atteins la manche 8 pour le fragment de mot de passe.</span></>
      : null;
    
    setResultBadge({ text: 'RATÉ', cls: 'fail' });
    setResultDetail(<>Échec à la manche {r}.<br/><br/>Séquence correcte :<br/>{seq.map((a, i) => <span key={i} style={{color: COLOR[a]}}>{GLYPH[a]} </span>)}{hint}</>);
    setResultBtnText('RÉESSAYER');
    gameOverRef.current = true;
    setGameOver(true);
    setScreen('result');
  }, []);

  const handleResult = useCallback(() => {
    if (gameOverRef.current) {
      roundRef.current = 1;
      setRound(1);
      gameOverRef.current = false;
      setGameOver(false);
      setScreen('idle');
    } else {
      startRound(roundRef.current);
    }
  }, [startRound]);

  useEffect(() => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const handler = (e) => {
      if (map[e.key] && screen === 'input') {
        e.preventDefault();
        handleArrow(map[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, handleArrow]);

  const progress = sequence.length > 0 ? (inputIdx / sequence.length) * 100 : 0;

  const slotStyles = {
    correct: 'border-[#39ff14] bg-[rgba(57,255,20,0.08)]',
    wrong:   'border-[#ff4040] bg-[rgba(255,64,64,0.08)]',
    pending: 'border-white/10 bg-white/5 opacity-30',
    current: 'border-[#39ff14] bg-[rgba(57,255,20,0.05)]'
  };

  return (
    <>
      <style>{minimalStyles}</style>
      
      <div style={{ background: '#05050f', color: '#fff', fontFamily: "'Share Tech Mono', monospace" }} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">

        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(57,255,20,0.04) 39px, rgba(57,255,20,0.04) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(57,255,20,0.04) 39px, rgba(57,255,20,0.04) 40px)
            `
          }}
        />

        <div className="relative z-10 w-[min(560px,96vw)] flex flex-col items-center gap-0">

          <header className="w-full flex justify-between items-baseline pb-3 mb-7" style={{ borderBottom: '1px solid rgba(57,255,20,0.15)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '42px', letterSpacing: '3px', color: '#39ff14', lineHeight: 1, textShadow: '0 0 16px rgba(57,255,20,0.4)' }}>
              Séquence<span style={{ color: '#333' }}>//</span>Flèches
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-[2px]" style={{ color: '#444' }}>Manche</div>
                <div className="text-[22px] font-bold leading-[1.1]" style={{ color: '#39ff14' }}>{round}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-[2px]" style={{ color: '#444' }}>Meilleur</div>
                <div className="text-[22px] font-bold leading-[1.1]" style={{ color: '#fff' }}>{best || '—'}</div>
              </div>
            </div>
          </header>

          {screen === 'idle' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="ms-enter" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '26px', letterSpacing: '4px', color: '#39ff14', textAlign: 'center' }}>
                Observe. Mémorise. Répète.
              </div>
              <div className="ms-enter-d1 w-full px-6 py-5 flex flex-col gap-2.5" style={{ background: 'rgba(12,12,24,0.8)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '8px' }}>
                {[
                  "Regarde la séquence s'afficher.",
                  <span key="b">Reproduis-la dans le <strong style={{ color: '#39ff14' }}>même ordre exact</strong>.</span>,
                  "12 manches. Vitesse croissante.",
                  "Manche 8 = Fragment de mot de passe.",
                ].map((text, i) => (
                  <div key={i} className="text-[12px] flex gap-2.5 leading-relaxed" style={{ color: '#555' }}>
                    <span style={{ color: '#39ff14', flexShrink: 0 }}>—</span>{text}
                  </div>
                ))}
              </div>
              <button
                className="w-full py-[14px] px-12 cursor-pointer transition-all duration-100 active:scale-[0.98] uppercase tracking-[0.15em]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#39ff14', background: 'transparent', border: '1px solid #39ff14', borderRadius: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#39ff14'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#39ff14'; }}
                onClick={startGame}
              >
                COMMENCER
              </button>
              {onBack && (
                <button
                  className="w-full py-2.5 px-12 cursor-pointer transition-all duration-100 active:scale-[0.98] uppercase tracking-[0.15em]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#555', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  onClick={onBack}
                >
                  ← ARCADE
                </button>
              )}
            </div>
          )}

          {screen === 'watch' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="w-full p-7 flex flex-col items-center gap-5" style={{ background: 'rgba(12,12,24,0.8)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '8px' }}>
                <div className="text-[10px] tracking-[3px] uppercase self-start" style={{ color: '#444' }}>
                  Mémorisation
                </div>
                <div
                  className="w-[120px] h-[120px] flex items-center justify-center border-2 transition-colors duration-100"
                  style={{ borderColor: arrowDisplay.flashColor, background: 'rgba(5,5,15,0.8)', borderRadius: '4px' }}
                >
                  <span style={{ color: arrowDisplay.color, fontSize: 72 }}>
                    {arrowDisplay.glyph}
                  </span>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '3px', color: '#39ff14' }}>
                  {countdown}
                </div>
              </div>
            </div>
          )}

          {screen === 'input' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="w-full p-7 flex flex-col items-center gap-5" style={{ background: 'rgba(12,12,24,0.8)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '8px' }}>
                <div className="text-[10px] tracking-[3px] uppercase self-start" style={{ color: '#444' }}>
                  Saisie de la séquence
                </div>
                <div className="flex gap-1.5 flex-wrap justify-center min-h-[52px] items-center">
                  {slots.map((slot, i) => (
                    <div
                      key={i}
                      className={`w-[44px] h-[44px] flex items-center justify-center text-[24px] border ${slotStyles[slot.state]}`}
                      style={{ color: slot.color }}
                    >
                      {slot.glyph}
                    </div>
                  ))}
                </div>
                <div className="w-full h-[3px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full transition-[width] duration-300 ease-in-out"
                    style={{ width: progress + '%', background: '#39ff14', boxShadow: '0 0 6px rgba(57,255,20,0.6)' }}
                  />
                </div>
              </div>

              <div className={`grid grid-cols-[repeat(3,64px)] grid-rows-[repeat(3,64px)] gap-1 ${shaking ? 'animate-shake' : ''}`}>
                {[
                  { cls: 'col-start-2 row-start-1', dir: 'up',    glyph: '↑', hoverBorder: '#e0e0e0' },
                  { cls: 'col-start-1 row-start-2', dir: 'left',  glyph: '←', hoverBorder: '#2db80d' },
                  { cls: 'col-start-2 row-start-2', dir: 'down',  glyph: '↓', hoverBorder: '#39ff14' },
                  { cls: 'col-start-3 row-start-2', dir: 'right', glyph: '→', hoverBorder: '#888888' },
                ].map(({ cls, dir, glyph, hoverBorder }) => (
                  <button
                    key={dir}
                    className={`${cls} text-[28px] cursor-pointer flex items-center justify-center transition-all duration-75 select-none active:scale-[0.92]`}
                    style={{ background: 'rgba(12,12,24,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.background = 'rgba(57,255,20,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(12,12,24,0.9)'; }}
                    onClick={() => handleArrow(dir)}
                  >{glyph}</button>
                ))}
              </div>
            </div>
          )}

          {screen === 'result' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="ms-enter" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '72px', lineHeight: 1, letterSpacing: '4px', color: resultBadge.cls === 'win' ? '#39ff14' : '#ff4040', textShadow: resultBadge.cls === 'win' ? '0 0 20px rgba(57,255,20,0.5)' : '0 0 20px rgba(255,64,64,0.5)' }}>
                {resultBadge.text}
              </div>
              <div className="ms-enter-d1 text-[13px] text-center leading-[1.8]" style={{ color: '#555' }}>
                {resultDetail}
              </div>
              <button
                className="w-full py-3.5 px-12 cursor-pointer transition-all duration-100 active:scale-[0.98] uppercase tracking-[0.15em]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#39ff14', background: 'transparent', border: '1px solid #39ff14', borderRadius: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#39ff14'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#39ff14'; }}
                onClick={handleResult}
              >
                {resultBtnText}
              </button>
              {onBack && (
                <button
                  className="w-full py-2.5 px-12 cursor-pointer transition-all duration-100 active:scale-[0.98] uppercase tracking-[0.15em]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#555', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  onClick={onBack}
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