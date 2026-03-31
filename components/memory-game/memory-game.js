'use client';

import { useState, useEffect, useRef, useCallback } from "react";

const EMOJIS = ['🐬','🌵','🍄','🎸','🚀','🦋','🍕','🎲','🌙','🐙',
                '🦁','🍉','⚡','🌺','🦄','🐉','🎪','🍦','🎵','🧩'];

const JOKES = [
  {
    setup: "Pourquoi les plongeurs plongent-ils toujours en arrière ?",
    punchline: "Parce que s'ils plongeaient en avant, ils tomberaient dans le bateau !"
  }
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap');

  .font-dm-serif { font-family: 'Bebas Neue', sans-serif; }
  .font-dm-mono { font-family: 'Share Tech Mono', 'Courier New', monospace; }

  /* Utilities for 3D card flip */
  .perspective-700 { perspective: 700px; }
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  
  .card-inner {
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card.flipped .card-inner,
  .card.matched .card-inner { transform: rotateY(180deg); }
  
  .card:not(.flipped):not(.matched):hover .card-inner {
    transform: rotateY(6deg) translateY(-3px);
  }

  .card-front-face { transform: rotateY(180deg); }

  /* Animations */
  @keyframes matchPop {
    0%   { transform: rotateY(180deg) scale(1); }
    35%  { transform: rotateY(180deg) scale(1.12); }
    65%  { transform: rotateY(180deg) scale(0.96); }
    100% { transform: rotateY(180deg) scale(1); }
  }
  .card.matched .card-inner { animation: matchPop 0.4s ease 0.1s both; }

  @keyframes revealLetter {
    0%   { transform: scale(0.3) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.3) rotate(5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; color: #fff; }
  }
  .animate-reveal { animation: revealLetter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: none; }
  }
  .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes shakeIn {
    0%   { transform: scale(0.8) rotate(-3deg); opacity: 0; }
    50%  { transform: scale(1.05) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .animate-shake-in { animation: shakeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes secretIn {
    from { opacity: 0; transform: scale(0.7) rotate(-5deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .animate-secret-in { animation: secretIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes spin360 {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .animate-spin-360 { animation: spin360 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes mg-fadeUp { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:translateY(0);} }
  .mg-enter    { animation: mg-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .mg-enter-d1 { animation: mg-fadeUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
  .mg-enter-d2 { animation: mg-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
  .mg-enter-d3 { animation: mg-fadeUp 0.5s 0.24s cubic-bezier(0.22,1,0.36,1) both; }

  .bg-secret-pattern {
    background-image: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.02) 6px, rgba(255,255,255,0.02) 12px);
  }
`;

function playSound(src) {
  const audio = new Audio(src);
  audio.play().catch(() => {});
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function MemoryGame({
  totalPairs = 12,
  maxMoves = 15,
  secretEmoji = '🦊',
  secretLetter = 'Z',
  onWin,
  onBack,
}) {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [secretFound, setSecretFound] = useState(false);
  const [time, setTime] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'failed', 'secret'
  
  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState({ text: 'Une seule lettre…', status: 'idle' });
  const [bumpStats, setBumpStats] = useState({ moves: false, pairs: false });
  const [joke, setJoke] = useState(JOKES[0]);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const normalizedSecretLetter = secretLetter.toUpperCase();

  // Initialize Game
  const startNewGame = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    startTimeRef.current = null;
    
    // Build deck
    const pool = EMOJIS.filter(e => e !== secretEmoji);
    const chosen = shuffle([...pool]).slice(0, totalPairs - 1);
    chosen.push(secretEmoji);
    const newDeck = shuffle([...chosen, ...chosen]).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      isSecret: emoji === secretEmoji
    }));

    setCards(newDeck);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setIsLocked(false);
    setSecretFound(false);
    setTime(0);
    setGameStatus('playing');
    setCodeInput('');
    setCodeFeedback({ text: 'Une seule lettre…', status: 'idle' });
    setJoke(JOKES[Math.floor(Math.random() * JOKES.length)]);
  }, [totalPairs, secretEmoji]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (gameStatus === 'secret' && onWin) onWin();
  }, [gameStatus, onWin]);

  useEffect(() => {
    if (gameStatus === 'failed') playSound('/game over.mp3');
  }, [gameStatus]);

  // Handle Card Flip
  const handleCardClick = (index) => {
    if (isLocked || gameStatus !== 'playing') return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    playSound('/select card.mp3');

    // Start timer on first interaction
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      const newMoves = moves + 1;
      setMoves(newMoves);
      triggerBump('moves');

      if (newMoves > maxMoves) {
        setTimeout(() => setGameStatus('failed'), 700);
        return;
      }

      const [firstIndex, secondIndex] = newFlippedIndices;
      
      // Match found
      if (newCards[firstIndex].emoji === newCards[secondIndex].emoji) {
        playSound('/card success.mp3');
        setTimeout(() => {
          setCards(prev => {
            const matchedCards = [...prev];
            matchedCards[firstIndex].isMatched = true;
            matchedCards[secondIndex].isMatched = true;
            matchedCards[firstIndex].isFlipped = false;
            matchedCards[secondIndex].isFlipped = false;
            return matchedCards;
          });
          
          setMatchedPairs(prev => {
            const newPairs = prev + 1;
            triggerBump('pairs');
            if (newPairs === totalPairs) {
              setTimeout(() => {
                clearInterval(timerRef.current);
                setGameStatus('won');
              }, 500);
            }
            return newPairs;
          });

          if (newCards[firstIndex].isSecret && !secretFound) {
            setSecretFound(true);
          }

          setFlippedIndices([]);
          setIsLocked(false);
        }, 400);
      } else {
        // No match
        playSound('/card missmatch.mp3');
        setTimeout(() => {
          setCards(prev => {
            const unflippedCards = [...prev];
            unflippedCards[firstIndex].isFlipped = false;
            unflippedCards[secondIndex].isFlipped = false;
            return unflippedCards;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const triggerBump = (stat) => {
    setBumpStats(prev => ({ ...prev, [stat]: true }));
    setTimeout(() => setBumpStats(prev => ({ ...prev, [stat]: false })), 150);
  };

  const checkCode = () => {
    const input = codeInput.trim().toUpperCase();
    if (!input) {
      setCodeFeedback({ text: "Entre une lettre d'abord !", status: 'wrong' });
      return;
    }

    if (input === normalizedSecretLetter) {
      setCodeFeedback({ text: '✦ Correct ! ✦', status: 'right' });
      setTimeout(() => setGameStatus('secret'), 600);
    } else {
      setCodeFeedback({ text: 'Mauvaise lettre… cherche encore !', status: 'wrong' });
      setCodeInput('');
      // Flash effect could be added here
    }
  };

  if (showIntro) {
    return (
      <>
        <style>{styles}</style>
        <div className="flex flex-col items-center font-dm-mono text-white py-10 px-4 min-h-screen box-border relative justify-center" style={{ background: '#05050f' }}>
          <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(191,0,255,0.04) 39px,rgba(191,0,255,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(191,0,255,0.04) 39px,rgba(191,0,255,0.04) 40px)' }} />
          <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(191,0,255,0.06) 0%, transparent 65%)' }} />

          {/* Title */}
          <div className="mg-enter text-center mb-8">
            <p className="text-[0.65rem] tracking-[4px] uppercase mb-2" style={{ color: '#444' }}>✦ Jeu de concentration ✦</p>
            <h1 className="font-dm-serif leading-none text-white m-0" style={{ fontSize: 'clamp(2.8rem,7vw,5rem)', letterSpacing: '0.05em', textShadow: '0 0 20px rgba(191,0,255,0.3)' }}>
              MÉ<span style={{ color: '#bf00ff' }}>MOIRE</span>
            </h1>
            <p className="text-[0.7rem] tracking-[3px] mt-2 uppercase" style={{ color: '#444' }}>Un secret se cache ici</p>
          </div>

          <hr className="mg-enter-d1 w-[60px] border-none border-t mb-8" style={{ borderColor: 'rgba(191,0,255,0.3)' }} />

          {/* Instructions */}
          <div className="mg-enter-d1 w-full max-w-sm rounded-xl p-5 flex flex-col gap-3 mb-4" style={{ background: 'rgba(191,0,255,0.04)', border: '1px solid rgba(191,0,255,0.15)' }}>
            <p className="text-[0.6rem] tracking-[3px] uppercase" style={{ color: '#555' }}>Objectif</p>
            <p className="text-[0.75rem] leading-relaxed" style={{ color: '#999' }}>
              Retourne les cartes et trouve les paires. Une paire mystère <span style={{ color: '#bf00ff' }}>{secretEmoji}</span> est cachée dans la grille — trouve-la pour révéler la <span style={{ color: '#bf00ff' }}>lettre secrète</span> et valide-la pour gagner.
            </p>
            <div className="flex gap-3 pt-1 border-t border-white/5 mt-1 flex-wrap">
              {[
                { icon: '✦', label: `${totalPairs} paires à trouver` },
                { icon: '⚡', label: `Max ${maxMoves} essais` },
                { icon: '🦊', label: 'Paire mystère = lettre secrète' },
              ].map(({ icon, label }, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span style={{ color: '#bf00ff', fontSize: '0.75rem' }}>{icon}</span>
                  <span className="text-[0.65rem]" style={{ color: '#555' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mg-enter-d2 w-full max-w-sm rounded-xl p-5 flex flex-col gap-3 mb-8" style={{ background: 'rgba(12,12,28,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[0.6rem] tracking-[3px] uppercase" style={{ color: '#555' }}>Comment jouer</p>
            <div className="flex flex-col gap-2">
              {[
                { step: '1', desc: 'Clique sur une carte pour la retourner' },
                { step: '2', desc: 'Retourne une 2ème carte — si identique, elles restent visibles' },
                { step: '3', desc: 'Quand la paire 🦊 est trouvée, entre la lettre affichée' },
                { step: '4', desc: 'Valide pour débloquer le jeu suivant' },
              ].map(({ step, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="text-[0.65rem] font-bold shrink-0 mt-0.5" style={{ color: '#bf00ff' }}>{step}.</span>
                  <span className="text-[0.72rem] leading-relaxed" style={{ color: '#666' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="mg-enter-d3 flex flex-col items-center gap-3 w-full max-w-sm">
            <button
              className="w-full py-4 cursor-pointer tracking-[0.15em] uppercase transition-all active:scale-[0.98] font-dm-mono text-[0.95rem] font-bold rounded-lg"
              style={{ color: '#bf00ff', background: 'transparent', border: '1px solid #bf00ff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#bf00ff'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#bf00ff'; }}
              onClick={() => { setShowIntro(false); startNewGame(); }}
            >
              ▶ COMMENCER
            </button>
            {onBack && (
              <button
                className="w-full py-2.5 cursor-pointer tracking-[0.15em] uppercase transition-all active:scale-[0.98] font-dm-mono text-[0.8rem] font-bold rounded-lg"
                style={{ color: '#555', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onClick={onBack}
              >
                ← ARCADE
              </button>
            )}
          </div>

        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col items-center font-dm-mono text-white py-10 px-4 min-h-screen box-border relative" style={{ background: '#05050f' }}>
        
        {/* Header */}
        <header className="text-center mb-2">
          <p className="text-[0.65rem] tracking-[4px] uppercase mb-1.5" style={{ color: '#444' }}>✦ Jeu de concentration ✦</p>
          <h1 className="font-dm-serif leading-none text-white m-0" style={{ fontSize: 'clamp(2.8rem,7vw,5rem)', letterSpacing: '0.05em', textShadow: '0 0 20px rgba(191,0,255,0.3)' }}>
            MÉ<span style={{ color: '#bf00ff' }}>MOIRE</span>
          </h1>
          <p className="text-[0.7rem] tracking-[3px] mt-2 uppercase" style={{ color: '#444' }}>Un secret se cache ici</p>
        </header>

        <hr className="w-[60px] border-none border-t my-5 mx-auto" style={{ borderColor: 'rgba(191,0,255,0.3)' }} />

        {/* Stats */}
        <div className="flex gap-10 mb-7 items-center">
          <div className="flex flex-col items-center">
            <span className={`font-dm-serif text-3xl leading-none transition-all duration-150 
              ${bumpStats.moves ? 'scale-125 text-[#bf00ff]' : 'text-white'} 
              ${moves >= maxMoves - 2 ? '!text-[#bf00ff]' : ''}`}
            >
              {moves}
            </span>
            <span className="text-[0.6rem] tracking-[2px] uppercase text-[#555] mt-1">Essais</span>
          </div>
          <span className="text-[#444] text-2xl">·</span>
          <div className="flex flex-col items-center">
            <span className={`font-dm-serif text-3xl leading-none transition-all duration-150 text-white
              ${bumpStats.pairs ? 'scale-125 text-[#bf00ff]' : ''}`}
            >
              {matchedPairs}
            </span>
            <span className="text-[0.6rem] tracking-[2px] uppercase text-[#555] mt-1">Paires</span>
          </div>
          <span className="text-[#444] text-2xl">·</span>
          <div className="flex flex-col items-center">
            <span className="font-dm-serif text-3xl text-white leading-none">{time}s</span>
            <span className="text-[0.6rem] tracking-[2px] uppercase text-[#555] mt-1">Temps</span>
          </div>
        </div>

        {/* Secret Zone */}
        <div className="text-white rounded-[10px] py-3.5 px-8 mb-7 text-center relative overflow-hidden min-w-65 transition-all duration-200" style={{ background: 'rgba(12,12,28,0.9)', border: secretFound ? '1px solid #bf00ff' : '1px solid rgba(191,0,255,0.15)', boxShadow: secretFound ? '0 0 20px rgba(191,0,255,0.2)' : 'none' }}>
          <div className="absolute inset-0 bg-secret-pattern pointer-events-none"></div>
          <div className="relative z-10 text-[0.6rem] tracking-[4px] uppercase text-white/40 mb-2">▲ Code Secret ▲</div>
          <span className={`font-dm-serif text-5xl min-w-[50px] inline-block text-center relative z-10 ${secretFound ? 'text-white animate-reveal' : 'text-white/15'}`}>
            {secretFound ? normalizedSecretLetter : '?'}
          </span>
          <div className="relative z-10 text-[0.6rem] tracking-[2px] text-white/30 mt-1">
            {secretFound ? '✦ Entre la lettre pour valider ✦' : 'Trouvez la paire mystère…'}
          </div>

          {/* Saisie du code dès que la lettre est trouvée */}
          {secretFound && gameStatus === 'playing' && (
            <div className="relative z-10 flex flex-col items-center gap-2 mt-4">
              <input
                className="font-dm-serif text-[2rem] w-16 text-center bg-transparent text-white border-none outline-none tracking-[4px] uppercase"
                style={{ borderBottom: `2px solid ${codeFeedback.status === 'wrong' ? '#ff4040' : '#bf00ff'}` }}
                maxLength={1}
                placeholder="?"
                autoComplete="off"
                spellCheck="false"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkCode()}
              />
              <div className={`text-[0.7rem] tracking-[2px] min-h-4 transition-colors duration-200 ${codeFeedback.status === 'wrong' ? 'text-[#ff4040]' : codeFeedback.status === 'right' ? 'text-[#bf00ff]' : 'text-[#555]'}`}>
                {codeFeedback.text}
              </div>
              <button
                className="font-dm-mono text-[0.7rem] tracking-[2px] uppercase rounded-lg py-1.5 px-5 cursor-pointer transition-all duration-150 border border-[#bf00ff] bg-transparent text-[#bf00ff] hover:bg-[#bf00ff] hover:text-black active:scale-95"
                onClick={checkCode}
              >
                Valider →
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-3 max-w-[460px] w-full mb-6">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className={`card aspect-square cursor-pointer perspective-700 
                ${card.isFlipped ? 'flipped' : ''} 
                ${card.isMatched ? 'matched' : ''}
                ${card.isSecret ? 'secret-card' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="card-inner w-full h-full relative preserve-3d rounded-[10px]">
                {/* Back of card (visible when face down) */}
                <div className="card-face card-back-face absolute inset-0 rounded-[10px] backface-hidden flex items-center justify-center select-none overflow-hidden" style={{ background: 'rgba(12,12,28,0.95)', border: '1px solid rgba(191,0,255,0.2)' }}>
                   <div className="absolute inset-1 border rounded-md pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.04)' }}></div>
                   <span className="text-[1.1rem]" style={{ color: 'rgba(191,0,255,0.3)' }}>✦</span>
                </div>
                {/* Front of card (visible when flipped) */}
                <div className={`card-face card-front-face absolute inset-0 rounded-[10px] backface-hidden flex items-center justify-center select-none bg-[#3a3a3a] border-2 
                  ${card.isMatched && !card.isSecret ? 'border-[#d4a843] shadow-[0_0_14px_rgba(212,168,67,0.25)]' : ''}
                  ${card.isMatched && card.isSecret ? 'border-[#c0392b] shadow-[0_0_20px_rgba(192,57,43,0.3)]' : ''}
                  ${!card.isMatched ? 'border-white' : ''}
                  text-[clamp(1.8rem,4.5vw,2.4rem)] flex-col`}
                >
                  {card.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border border-[#bf00ff] bg-transparent text-[#bf00ff] hover:bg-[#bf00ff] hover:text-black active:scale-95"
          onClick={startNewGame}
        >
          ↺ Recommencer
        </button>

        {/* --- OVERLAYS --- */}

        {/* Win Overlay */}
        {gameStatus === 'won' && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 backdrop-blur-sm" style={{ background: 'rgba(5,5,15,0.97)' }}>
            <div className="text-center animate-slide-up max-w-[400px] p-4">
              <div className="font-dm-serif text-white" style={{ fontSize: 'clamp(2.5rem,7vw,4rem)', letterSpacing: '-0.01em' }}>
                Bien <span style={{ color: '#bf00ff' }}>joué !</span>
              </div>
              <div className="text-[0.7rem] tracking-[2px] uppercase mt-2" style={{ color: '#555' }}>
                {moves} essais · {time}s · {totalPairs} paires
              </div>
              <div className="text-[0.6rem] mt-1 italic" style={{ color: '#555' }}>
                {!secretFound && '(paire mystère non trouvée…)'}
              </div>

              <hr className="w-[40px] border-none border-t my-5 mx-auto" style={{ borderColor: 'rgba(191,0,255,0.3)' }} />

              <div className="flex flex-col items-center gap-3">
                <div className="text-[0.65rem] tracking-[3px] uppercase" style={{ color: '#555' }}>Entrez le code secret</div>
                <input
                  className="font-dm-serif text-[2.5rem] w-[80px] text-center text-white border-none rounded-lg py-1 px-2 outline-none tracking-[4px] uppercase transition-colors placeholder:text-white/20"
                  style={{ background: 'rgba(12,12,28,0.9)', boxShadow: '0 0 0 1px rgba(191,0,255,0.3)' }}
                  maxLength="1" 
                  placeholder="?" 
                  autoComplete="off" 
                  spellCheck="false"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkCode()}
                  autoFocus
                />
                <div className={`text-[0.75rem] tracking-[2px] min-h-[1.2rem] transition-colors duration-200 
                  ${codeFeedback.status === 'wrong' ? 'text-[#bf00ff]' : codeFeedback.status === 'right' ? 'text-[#27ae60]' : 'text-[#555]'}`}
                >
                  {codeFeedback.text}
                </div>
                <button 
                  className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border-2 border-[#bf00ff] bg-[#bf00ff] text-white hover:bg-[#9900cc] hover:border-[#9900cc] active:scale-95 mt-2"
                  onClick={checkCode}
                >
                  Valider
                </button>
              </div>
              <br />
              <button 
                className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border border-[#bf00ff] bg-transparent text-[#bf00ff] hover:bg-[#bf00ff] hover:text-black active:scale-95"
                onClick={startNewGame}
              >
                Rejouer
              </button>
            </div>
          </div>
        )}

        {/* Fail Overlay */}
        {gameStatus === 'failed' && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 text-center p-8 backdrop-blur-md" style={{ background: 'rgba(5,5,15,0.98)' }}>
            <div className="animate-shake-in">
              <span className="text-6xl block mb-2">💥</span>
              <div className="font-dm-serif text-[#bf00ff]" style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', letterSpacing: '-0.01em', textShadow: '0 0 20px rgba(191,0,255,0.4)' }}>Trop d'essais !</div>
              <div className="text-[0.7rem] tracking-[3px] uppercase mt-1.5" style={{ color: '#555' }}>Plus de {maxMoves} essais — on repart de zéro</div>
            </div>
            <br />
            <button
              className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border border-[#bf00ff] bg-transparent text-[#bf00ff] hover:bg-[#bf00ff] hover:text-black active:scale-95"
              onClick={startNewGame}
            >
              Recommencer
            </button>
          </div>
        )}

        {/* Secret Overlay */}
        {gameStatus === 'secret' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 text-white text-center p-8" style={{ background: 'rgba(5,5,15,0.98)', borderTop: '2px solid #bf00ff', boxShadow: 'inset 0 0 80px rgba(191,0,255,0.08)' }}>
            <div className="animate-secret-in flex flex-col items-center">
              <span className="text-[3rem] block mb-4 animate-spin-360">🔓</span>
              <div className="text-[0.65rem] tracking-[5px] uppercase mb-4" style={{ color: '#bf00ff' }}>✦ Code correct ✦</div>
              <div className="font-dm-serif leading-[1.25] max-w-[500px]" style={{ fontSize: 'clamp(1.6rem,5vw,2.8rem)', color: '#eee' }}>
                {joke.setup}
              </div>
              <div className="font-dm-serif mt-2" style={{ fontSize: 'clamp(1rem,3vw,1.6rem)', color: '#aaa' }}>
                {joke.punchline}
              </div>
            </div>
            <br />
            <div className="flex gap-3 mt-4">
              {onBack && (
                <button
                  className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border border-white/20 bg-transparent text-white/60 hover:bg-white/10 hover:text-white active:scale-95"
                  onClick={onBack}
                >
                  ← Retour
                </button>
              )}
              <button
                className="font-dm-mono text-[0.75rem] tracking-[2px] uppercase rounded-lg py-2.5 px-7 cursor-pointer transition-all duration-150 border border-[#bf00ff] bg-transparent text-[#bf00ff] hover:bg-[#bf00ff] hover:text-black active:scale-95"
                onClick={startNewGame}
              >
                Rejouer
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}