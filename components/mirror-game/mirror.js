'use client';

import { useState, useEffect, useRef, useCallback } from "react";

const ARROWS = ['up', 'down', 'left', 'right'];
const GLYPH  = { up: '↑', down: '↓', left: '←', right: '→' };
const COLOR  = { up: '#111111', down: '#e00000', left: '#cc0000', right: '#888888' };
const MAX_ROUNDS = 12;
const MIN_ROUND_FOR_FRAGMENT = 8;
const PASSWORD_FRAGMENT = 'K';

function getDelay(round) {
  return Math.round(900 - (round - 1) * (680 / 11));
}

function randomSequence(len) {
  return Array.from({ length: len }, () => ARROWS[Math.floor(Math.random() * 4)]);
}

// Nous gardons juste l'import des polices et l'animation keyframe spécifique
const minimalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

  .animate-shake {
    animation: ms-shake 0.35s ease;
  }

  @keyframes ms-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-6px); }
    80%     { transform: translateX(6px); }
  }
`;

export default function MirrorSequence() {
  const [screen, setScreen]       = useState('idle');
  const [round, setRound]         = useState(1);
  const [best, setBest]           = useState(0);
  const [sequence, setSequence]   = useState([]);
  const [inputIdx, setInputIdx]   = useState(0);
  const [slots, setSlots]         = useState([]);
  const [dotStates, setDotStates] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [arrowDisplay, setArrowDisplay] = useState({ glyph: '?', color: '#ddd', flashColor: '#e0e0e0' });
  const [resultBadge, setResultBadge]   = useState({ text: '', cls: '' });
  const [resultDetail, setResultDetail] = useState(null);
  const [resultBtnText, setResultBtnText] = useState('');
  const [gameOver, setGameOver]   = useState(false);
  const [shaking, setShaking]     = useState(false);

  const seqRef     = useRef([]);
  const inputIdxRef = useRef(0);
  const roundRef   = useRef(1);
  const gameOverRef = useRef(false);
  const bestRef    = useRef(0);

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

  const playSequence = useCallback((seq, r) => {
    setScreen('watch');
    setDotStates(Array(seq.length).fill('idle'));
    setArrowDisplay({ glyph: '?', color: '#ddd', flashColor: '#e0e0e0' });
    const delay = getDelay(r);
    setCountdown(`Vitesse : ${delay}ms/flèche`);

    let i = 0;
    function showNext() {
      if (i > 0) setDotStates(prev => prev.map((d, idx) => idx === i - 1 ? 'done' : d));
      if (i < seq.length) {
        setDotStates(prev => prev.map((d, idx) => idx === i ? 'active' : d));
        const dir = seq[i];
        setArrowDisplay({ glyph: GLYPH[dir], color: COLOR[dir], flashColor: COLOR[dir] });
        setCountdown(`${seq.length - i} restante${seq.length - i > 1 ? 's' : ''}`);
        i++;
        setTimeout(showNext, delay);
      } else {
        setCountdown('À toi !');
        setArrowDisplay({ glyph: '. . .', color: '#ccc', flashColor: '#e0e0e0' });
        setTimeout(() => beginInput(seq), 500);
      }
    }
    showNext();
  }, []);

  const beginInput = useCallback((seq) => {
    setScreen('input');
    setSlots(seq.map((_, idx) => ({ glyph: '', color: '', state: idx === 0 ? 'current' : 'pending' })));
    inputIdxRef.current = 0;
    setInputIdx(0);
  }, []);

  const handleArrow = useCallback((dir) => {
    const seq = seqRef.current;
    const idx = inputIdxRef.current;
    if (idx >= seq.length) return;

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
    const r = roundRef.current;
    const seq = seqRef.current;
    const b = bestRef.current;
    const newBest = r > b ? r : b;
    if (r > b) { setBest(newBest); bestRef.current = newBest; }

    const unlocked = r >= MIN_ROUND_FOR_FRAGMENT;
    const fragmentEl = unlocked
      ? (
        <>
          <div className="mt-4 py-3 px-5 bg-[#fff0f0] border border-[#e00000] font-['Bebas_Neue',_sans-serif] text-[28px] tracking-[6px] text-[#e00000] text-center">
            {PASSWORD_FRAGMENT}
          </div>
          <div className="text-[10px] tracking-[2px] text-[#999] mt-1.5 text-center">
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
      setResultDetail(<>Les {MAX_ROUNDS} manches sont terminées.<br/>Séquence finale : {seq.length} flèches à {getDelay(r)}ms/flèche.<br/><br/>Tu es franchement terrifiant.{fragmentEl}</>);
      setResultBtnText('REJOUER');
      gameOverRef.current = true;
      setGameOver(true);
    } else {
      setResultBadge({ text: 'RÉUSSI', cls: 'win' });
      setResultDetail(<>Manche {r} / {MAX_ROUNDS} réussie.<br/>Séquence : {seq.length} flèches à {getDelay(r)}ms chacune.<br/><br/>Suivante : {seq.length + 1} flèches à {getDelay(r + 1)}ms chacune.{fragmentEl}</>);
      setResultBtnText('MANCHE SUIVANTE');
      roundRef.current = r + 1;
      setRound(r + 1);
      gameOverRef.current = false;
      setGameOver(false);
    }
    setScreen('result');
  }, []);

  const triggerFail = useCallback(() => {
    const r = roundRef.current;
    const seq = seqRef.current;
    const hint = r < MIN_ROUND_FOR_FRAGMENT
      ? <><br/><br/><span className="text-[#999] text-[11px]">Atteins la manche 8 pour débloquer un fragment. Il te manque encore {MIN_ROUND_FOR_FRAGMENT - r} manche{MIN_ROUND_FOR_FRAGMENT - r > 1 ? 's' : ''}.</span></>
      : null;
    
    setResultBadge({ text: 'RATÉ', cls: 'fail' });
    setResultDetail(<>Tu as atteint la manche {r} / {MAX_ROUNDS}.<br/>La séquence avait {seq.length} flèche{seq.length > 1 ? 's' : ''}.<br/><br/>La bonne séquence était :<br/>{seq.map((a, i) => <span key={i} style={{color: COLOR[a]}}>{GLYPH[a]} </span>)}{hint}</>);
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

  // Configuration des classes conditionnelles pour les slots
  const slotStyles = {
    correct: 'border-[#888888] bg-[#f5f5f5]',
    wrong:   'border-[#cc0000] bg-[#fff0f0]',
    pending: 'border-[#ccc] bg-[#f5f5f5] opacity-30',
    current: 'border-[#e00000] bg-[#f5f5f5]'
  };

  return (
    <>
      <style>{minimalStyles}</style>
      
      <div className="bg-white text-[#111111] font-['Space_Mono',_monospace] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Motif d'arrière-plan (grille) */}
        <div 
          className="fixed inset-0 pointer-events-none z-0" 
          style={{
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, #00000008 39px, #00000008 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, #00000008 39px, #00000008 40px)
            `
          }} 
        />

        <div className="relative z-10 w-[min(560px,96vw)] flex flex-col items-center gap-0">
          
          <header className="w-full flex justify-between items-baseline border-b border-[#e0e0e0] pb-3 mb-7">
            <div className="font-['Bebas_Neue',_sans-serif] text-[42px] tracking-[3px] text-[#e00000] leading-none">
              Séquence<span className="text-[#999]">//</span>Flèches
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-[9px] text-[#999] uppercase tracking-[2px]">Manche</div>
                <div className="text-[22px] font-bold text-[#e00000] leading-[1.1]">{round}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-[#999] uppercase tracking-[2px]">Meilleur</div>
                <div className="text-[22px] font-bold text-[#111111] leading-[1.1]">{best || '—'}</div>
              </div>
            </div>
          </header>

          {/* IDLE */}
          {screen === 'idle' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="font-['Bebas_Neue',_sans-serif] text-[26px] tracking-[4px] text-[#999] text-center">
                Observe. Mémorise. Répète.
              </div>
              <div className="w-full bg-[#f5f5f5] border border-[#e0e0e0] px-6 py-5 flex flex-col gap-2.5">
                <div className="text-[12px] text-[#999] flex gap-2.5 leading-relaxed before:content-['—'] before:text-[#e00000] before:shrink-0">
                  Regarde une séquence de flèches s'afficher une par une.
                </div>
                <div className="text-[12px] text-[#999] flex gap-2.5 leading-relaxed before:content-['—'] before:text-[#e00000] before:shrink-0">
                  <span>Reproduis-la dans le <strong className="text-[#e00000] font-bold">même ordre exact</strong>.</span>
                </div>
                <div className="text-[12px] text-[#999] flex gap-2.5 leading-relaxed before:content-['—'] before:text-[#e00000] before:shrink-0">
                  Commence à 1 flèche. +1 par manche. 12 manches au total. Les flèches s'accélèrent à chaque manche.
                </div>
                <div className="text-[12px] text-[#999] flex gap-2.5 leading-relaxed before:content-['—'] before:text-[#e00000] before:shrink-0">
                  Atteins la manche 8 pour débloquer un fragment de mot de passe.
                </div>
                <div className="text-[12px] text-[#999] flex gap-2.5 leading-relaxed before:content-['—'] before:text-[#e00000] before:shrink-0">
                  Une seule erreur et c'est terminé.
                </div>
              </div>
              <div className="text-[11px] text-[#999] tracking-[2px]">
                Meilleure manche : <span className="text-[#e00000]">{best ? 'manche ' + best : 'aucune'}</span>
              </div>
              <button 
                className="bg-[#e00000] text-white border-none font-['Bebas_Neue',_sans-serif] text-[28px] tracking-[3px] py-[14px] px-12 cursor-pointer w-full transition-all duration-100 hover:bg-[#b00000] active:scale-[0.98]" 
                onClick={startGame}
              >
                COMMENCER
              </button>
            </div>
          )}

          {/* WATCH */}
          {screen === 'watch' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="w-full bg-[#f5f5f5] border border-[#e0e0e0] p-7 flex flex-col items-center gap-5">
                <div className="text-[10px] tracking-[3px] uppercase text-[#999] self-start">
                  Mémorise la séquence
                </div>
                <div 
                  className="w-[120px] h-[120px] flex items-center justify-center border-2 transition-colors duration-100"
                  style={{ borderColor: arrowDisplay.flashColor }}
                >
                  <span style={{ color: arrowDisplay.color, fontSize: arrowDisplay.glyph === '. . .' ? 32 : 72 }}>
                    {arrowDisplay.glyph}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {dotStates.map((state, i) => (
                    <div 
                      key={i} 
                      className={`w-[10px] h-[10px] rounded-full transition-colors duration-150 
                        ${state === 'active' ? 'bg-[#e00000]' : state === 'done' ? 'bg-[#b00000]' : 'bg-[#ccc]'}`} 
                    />
                  ))}
                </div>
                <div className="font-['Bebas_Neue',_sans-serif] text-[18px] tracking-[3px] text-[#e00000]">
                  {countdown}
                </div>
              </div>
            </div>
          )}

          {/* INPUT */}
          {screen === 'input' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="w-full bg-[#f5f5f5] border border-[#e0e0e0] p-7 flex flex-col items-center gap-5">
                <div className="text-[10px] tracking-[3px] uppercase text-[#999] self-start">
                  Répète la séquence dans l'ordre
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
                <div className="w-full h-[3px] bg-[#e0e0e0]">
                  <div 
                    className="h-full bg-[#e00000] transition-[width] duration-300 ease-in-out" 
                    style={{ width: progress + '%' }} 
                  />
                </div>
              </div>
              
              <div className={`grid grid-cols-[repeat(3,64px)] grid-rows-[repeat(3,64px)] gap-1 ${shaking ? 'animate-shake' : ''}`}>
                <button 
                  className="col-start-2 row-start-1 bg-[#f5f5f5] border border-[#e0e0e0] text-[#111111] text-[28px] cursor-pointer flex items-center justify-center transition-all duration-75 select-none hover:bg-[#f0f0f0] hover:border-[#111111] active:scale-[0.92]" 
                  onClick={() => handleArrow('up')}>↑</button>
                <button 
                  className="col-start-1 row-start-2 bg-[#f5f5f5] border border-[#e0e0e0] text-[#111111] text-[28px] cursor-pointer flex items-center justify-center transition-all duration-75 select-none hover:bg-[#f0f0f0] hover:border-[#cc0000] active:scale-[0.92]" 
                  onClick={() => handleArrow('left')}>←</button>
                <button 
                  className="col-start-2 row-start-2 bg-[#f5f5f5] border border-[#e0e0e0] text-[#111111] text-[28px] cursor-pointer flex items-center justify-center transition-all duration-75 select-none hover:bg-[#f0f0f0] hover:border-[#e00000] active:scale-[0.92]" 
                  onClick={() => handleArrow('down')}>↓</button>
                <button 
                  className="col-start-3 row-start-2 bg-[#f5f5f5] border border-[#e0e0e0] text-[#111111] text-[28px] cursor-pointer flex items-center justify-center transition-all duration-75 select-none hover:bg-[#f0f0f0] hover:border-[#888888] active:scale-[0.92]" 
                  onClick={() => handleArrow('right')}>→</button>
              </div>
            </div>
          )}

          {/* RESULT */}
          {screen === 'result' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className={`font-['Bebas_Neue',_sans-serif] text-[72px] leading-none tracking-[4px] ${resultBadge.cls === 'win' ? 'text-[#e00000]' : 'text-[#cc0000]'}`}>
                {resultBadge.text}
              </div>
              <div className="text-[13px] text-[#999] text-center leading-[1.8]">
                {resultDetail}
              </div>
              <button 
                className="bg-[#e00000] text-white border-none font-['Bebas_Neue',_sans-serif] text-[28px] tracking-[3px] py-[14px] px-12 cursor-pointer w-full transition-all duration-100 hover:bg-[#b00000] active:scale-[0.98]" 
                onClick={handleResult}
              >
                {resultBtnText}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}