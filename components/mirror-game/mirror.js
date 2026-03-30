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
  const seq = [];
  for (let i = 0; i < len; i++) {
    const available = ARROWS.filter(a => a !== seq[i - 1]);
    seq.push(available[Math.floor(Math.random() * available.length)]);
  }
  return seq;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

  .ms-root {
    background: #ffffff;
    color: #111111;
    font-family: 'Space Mono', monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .ms-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 39px, #00000008 39px, #00000008 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, #00000008 39px, #00000008 40px);
    pointer-events: none;
    z-index: 0;
  }

  .ms-container {
    position: relative;
    z-index: 1;
    width: min(560px, 96vw);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .ms-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 12px;
    margin-bottom: 28px;
  }

  .ms-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    letter-spacing: 3px;
    color: #e00000;
    line-height: 1;
  }

  .ms-logo span { color: #999; }

  .ms-stats { display: flex; gap: 24px; }

  .ms-stat { text-align: right; }

  .ms-stat-label {
    font-size: 9px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .ms-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #111111;
    line-height: 1.1;
  }

  .ms-stat-value.accent { color: #e00000; }

  .ms-screen {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .ms-panel {
    width: 100%;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    padding: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .ms-panel-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #999;
    align-self: flex-start;
  }

  .ms-arrow-display {
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 72px;
    border: 2px solid #e0e0e0;
    transition: border-color 0.1s;
  }

  .ms-arrow-display.flash-up    { border-color: #111111; }
  .ms-arrow-display.flash-down  { border-color: #e00000; }
  .ms-arrow-display.flash-left  { border-color: #cc0000; }
  .ms-arrow-display.flash-right { border-color: #888888; }

  .ms-dots {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .ms-dot {
    width: 10px;
    height: 10px;
    background: #ccc;
    border-radius: 50%;
    transition: background 0.15s;
  }

  .ms-dot.active { background: #e00000; }
  .ms-dot.done   { background: #b00000; }

  .ms-countdown {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: #e00000;
  }

  .ms-input-sequence {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    min-height: 52px;
    align-items: center;
  }

  .ms-slot {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    border: 1px solid #e0e0e0;
    background: #f5f5f5;
  }

  .ms-slot.correct { border-color: #888888; }
  .ms-slot.wrong   { border-color: #cc0000; background: #fff0f0; }
  .ms-slot.pending { border-color: #ccc; opacity: 0.3; }
  .ms-slot.current { border-color: #e00000; }

  .ms-progress-bar {
    width: 100%;
    height: 3px;
    background: #e0e0e0;
  }

  .ms-progress-fill {
    height: 100%;
    background: #e00000;
    transition: width 0.3s ease;
  }

  .ms-arrow-btns {
    display: grid;
    grid-template-columns: repeat(3, 64px);
    grid-template-rows: repeat(3, 64px);
    gap: 4px;
  }

  .ms-arrow-btn {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    color: #111111;
    font-size: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.08s, border-color 0.08s, transform 0.08s;
    user-select: none;
  }

  .ms-arrow-btn:hover  { background: #f0f0f0; border-color: #bbb; }
  .ms-arrow-btn:active { transform: scale(0.92); }
  .ms-btn-up    { grid-column: 2; grid-row: 1; }
  .ms-btn-left  { grid-column: 1; grid-row: 2; }
  .ms-btn-down  { grid-column: 2; grid-row: 2; }
  .ms-btn-right { grid-column: 3; grid-row: 2; }
  .ms-btn-up:hover    { border-color: #111111; }
  .ms-btn-left:hover  { border-color: #cc0000; }
  .ms-btn-down:hover  { border-color: #e00000; }
  .ms-btn-right:hover { border-color: #888888; }

  .ms-arrow-btns.shake {
    animation: ms-shake 0.35s ease;
  }

  @keyframes ms-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-6px); }
    80%     { transform: translateX(6px); }
  }

  .ms-idle-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 4px;
    color: #999;
    text-align: center;
  }

  .ms-rules-list {
    width: 100%;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ms-rule-item {
    font-size: 12px;
    color: #999;
    display: flex;
    gap: 10px;
    line-height: 1.5;
  }

  .ms-rule-item::before { content: '—'; color: #e00000; flex-shrink: 0; }

  .ms-best-score { font-size: 11px; color: #999; letter-spacing: 2px; }
  .ms-best-score span { color: #e00000; }

  .ms-btn-primary {
    background: #e00000;
    color: #ffffff;
    border: none;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 3px;
    padding: 14px 48px;
    cursor: pointer;
    width: 100%;
    transition: background 0.1s, transform 0.1s;
  }

  .ms-btn-primary:hover  { background: #b00000; }
  .ms-btn-primary:active { transform: scale(0.98); }

  .ms-result-badge {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 72px;
    line-height: 1;
    letter-spacing: 4px;
  }

  .ms-result-badge.win  { color: #e00000; }
  .ms-result-badge.fail { color: #cc0000; }

  .ms-result-detail {
    font-size: 13px;
    color: #999;
    text-align: center;
    line-height: 1.8;
  }

  .ms-fragment-box {
    margin-top: 16px;
    padding: 12px 20px;
    background: #fff0f0;
    border: 1px solid #e00000;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 6px;
    color: #e00000;
    text-align: center;
  }

  .ms-fragment-label {
    font-size: 10px;
    letter-spacing: 2px;
    color: #999;
    margin-top: 6px;
    text-align: center;
  }

  .ms-hint {
    margin-top: 8px;
    font-size: 11px;
    color: #999;
    letter-spacing: 1px;
    text-align: center;
  }
`;

export default function MirrorSequence() {
  const [screen, setScreen]       = useState('idle');    // idle | watch | input | result
  const [round, setRound]         = useState(1);
  const [best, setBest]           = useState(0);
  const [sequence, setSequence]   = useState([]);
  const [inputIdx, setInputIdx]   = useState(0);
  const [slots, setSlots]         = useState([]);        // {glyph, color, state}[]
  const [dotStates, setDotStates] = useState([]);        // 'idle'|'active'|'done'
  const [countdown, setCountdown] = useState('');
  const [arrowDisplay, setArrowDisplay] = useState({ glyph: '?', color: '#ddd', flashClass: '' });
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

  // Keep refs in sync
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
    setArrowDisplay({ glyph: '?', color: '#ddd', flashClass: '' });
    const delay = getDelay(r);
    setCountdown(`Vitesse : ${delay}ms/flèche`);

    let i = 0;

    // Immediately activate first dot
    setDotStates(prev => prev.map((d, idx) => idx === 0 ? 'active' : d));

    function showNext() {
      if (i < seq.length) {
        const dir = seq[i];
        setArrowDisplay({ glyph: GLYPH[dir], color: COLOR[dir], flashClass: 'flash-' + dir });
        setCountdown(`${seq.length - i} restante${seq.length - i > 1 ? 's' : ''}`);
        i++;
        setTimeout(() => {
          setDotStates(prev => prev.map((d, idx) => {
            if (idx === i - 1) return 'done';
            if (idx === i) return 'active';
            return d;
          }));
          showNext();
        }, delay);
      } else {
        setCountdown('');
        setArrowDisplay({ glyph: '. . .', color: '#ccc', flashClass: '' });
        setTimeout(() => beginInput(seq), 400);
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
      ? <><div className="ms-fragment-box">{PASSWORD_FRAGMENT}</div><div className="ms-fragment-label">FRAGMENT DE MOT DE PASSE DÉBLOQUÉ</div></>
      : <div className="ms-hint">Atteins la manche 8 pour débloquer un fragment de mot de passe.</div>;

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
      ? <><br/><br/><span style={{color:'#999',fontSize:11}}>Atteins la manche 8 pour débloquer un fragment. Il te manque encore {MIN_ROUND_FOR_FRAGMENT - r} manche{MIN_ROUND_FOR_FRAGMENT - r > 1 ? 's' : ''}.</span></>
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

  // Keyboard support
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

  return (
    <>
      <style>{styles}</style>
      <div className="ms-root">
        <div className="ms-container">
          <header className="ms-header">
            <div className="ms-logo">Séquence<span>//</span>Flèches</div>
            <div className="ms-stats">
              <div className="ms-stat">
                <div className="ms-stat-label">Manche</div>
                <div className="ms-stat-value accent">{round}</div>
              </div>
              <div className="ms-stat">
                <div className="ms-stat-label">Meilleur</div>
                <div className="ms-stat-value">{best || '—'}</div>
              </div>
            </div>
          </header>

          {/* IDLE */}
          {screen === 'idle' && (
            <div className="ms-screen">
              <div className="ms-idle-title">Observe. Mémorise. Répète.</div>
              <div className="ms-rules-list">
                <div className="ms-rule-item">Regarde une séquence de flèches s'afficher une par une.</div>
                <div className="ms-rule-item">Reproduis-la dans le <strong style={{color:'#e00000'}}>même ordre exact</strong>.</div>
                <div className="ms-rule-item">Commence à 1 flèche. +1 par manche. 12 manches au total. Les flèches s'accélèrent à chaque manche.</div>
                <div className="ms-rule-item">Atteins la manche 8 pour débloquer un fragment de mot de passe.</div>
                <div className="ms-rule-item">Une seule erreur et c'est terminé.</div>
              </div>
              <div className="ms-best-score">Meilleure manche : <span>{best ? 'manche ' + best : 'aucune'}</span></div>
              <button className="ms-btn-primary" onClick={startGame}>COMMENCER</button>
            </div>
          )}

          {/* WATCH */}
          {screen === 'watch' && (
            <div className="ms-screen">
              <div className="ms-panel">
                <div className="ms-panel-label">Mémorise la séquence</div>
                <div className={`ms-arrow-display ${arrowDisplay.flashClass}`}>
                  <span style={{ color: arrowDisplay.color, fontSize: arrowDisplay.glyph === '. . .' ? 32 : 72 }}>
                    {arrowDisplay.glyph}
                  </span>
                </div>

                <div className="ms-countdown">{countdown}</div>
              </div>
            </div>
          )}

          {/* INPUT */}
          {screen === 'input' && (
            <div className="ms-screen">
              <div className="ms-panel">
                <div className="ms-panel-label">Répète la séquence dans l'ordre</div>
                <div className="ms-input-sequence">
                  {slots.map((slot, i) => {
                    if (slot.state === 'pending') return null;
                    return (
                      <div key={i} className={`ms-slot ${slot.state}`} style={{ color: slot.color }}>
                        {slot.glyph}
                      </div>
                    );
                  })}
                </div>
                <div className="ms-progress-bar">
                  <div className="ms-progress-fill" style={{ width: progress + '%' }} />
                </div>
              </div>
              <div className={`ms-arrow-btns${shaking ? ' shake' : ''}`}>
                <button className="ms-arrow-btn ms-btn-up"    onClick={() => handleArrow('up')}>↑</button>
                <button className="ms-arrow-btn ms-btn-left"  onClick={() => handleArrow('left')}>←</button>
                <button className="ms-arrow-btn ms-btn-down"  onClick={() => handleArrow('down')}>↓</button>
                <button className="ms-arrow-btn ms-btn-right" onClick={() => handleArrow('right')}>→</button>
              </div>
            </div>
          )}

          {/* RESULT */}
          {screen === 'result' && (
            <div className="ms-screen">
              <div className={`ms-result-badge ${resultBadge.cls}`}>{resultBadge.text}</div>
              <div className="ms-result-detail">{resultDetail}</div>
              <button className="ms-btn-primary" onClick={handleResult}>{resultBtnText}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}