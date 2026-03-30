'use client';

import { useState, useEffect } from 'react';
import RhythmGame from "../components/rythme-game/jeu_rythme";
import ControlGlitch from "@/components/control-glitch/control-glitch";
import MemoryGame from "@/components/memory-game/memory-game";
import QuestGame from "@/components/quest-game/QuestGame";
import MirrorSequence from "@/components/mirror-game/mirror";
import TuneSwitch from "@/components/Tune swicth/tune-switch";

function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1); // 1 = Seul le premier jeu est dispo
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger la progression sauvegardée (si elle existe)
  useEffect(() => {
    const savedProgress = localStorage.getItem('arcadeProgress');
    if (savedProgress) {
      setUnlockedLevel(parseInt(savedProgress, 10));
    }
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
    const currentIndex = games.findIndex(g => g.id === currentGame);
    // Si on a gagné le niveau max actuel, on débloque le suivant
    if (currentIndex + 2 > unlockedLevel) {
      const newLevel = Math.min(currentIndex + 2, games.length);
      setUnlockedLevel(newLevel);
      localStorage.setItem('arcadeProgress', newLevel);
    }
    // Optionnel : Retour automatique au menu après victoire
    // setCurrentGame(null); 
  };

  // Empêche le clignotement SSR
  if (!isLoaded) return null;

  // -- VUE EN JEU --
  if (currentGame) {
    const GameComponent = games.find(g => g.id === currentGame)?.component;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Header en jeu */}
        <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-gray-900/50">
          <button 
            onClick={() => setCurrentGame(null)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-semibold"
          >
            ← Retour à l'Arcade
          </button>
          
          {/* Bouton de test (à retirer en prod) */}
          <button 
            onClick={handleWin}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm font-bold shadow-[0_0_10px_rgba(147,51,234,0.5)]"
          >
            [Dev] Simuler une Victoire 🏆
          </button>
        </div>

        {/* Composant du jeu. On passe onWin en props ! */}
        <div className="flex-grow relative">
          <GameComponent onWin={handleWin} />
        </div>
      </div>
    );
  }

  // -- VUE MENU ARCADE --
  return (
    <div className="min-h-screen bg-[#090914] text-white flex flex-col items-center py-12 px-4 md:px-8 relative overflow-hidden">
      
      {/* Effets de fond Néon */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-center">
        
        {/* Titre Centré */}
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-8 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] uppercase tracking-widest text-center">
          Arcade Games
        </h1>

        {/* Barre de progression */}
        <div className="w-full max-w-lg mb-12 flex flex-col items-center">
            <div className="w-full bg-gray-900 rounded-full h-3 mb-3 border border-gray-800 overflow-hidden shadow-inner">
                <div 
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-3 rounded-full transition-all duration-700 ease-out relative" 
                    style={{ width: `${(unlockedLevel / games.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
            <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                Progression : <span className="text-white">{unlockedLevel} / {games.length}</span> Jeux Débloqués
            </p>
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
                    
                    {/* Zone Visuelle / Icône */}
                    <div className={`h-28 w-full rounded-xl mb-4 flex items-center justify-center text-4xl shadow-inner
                        ${isUnlocked ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80' : 'bg-gray-950/80'}
                    `}>
                         {isUnlocked ? '🎮' : '🔒'}
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
    </div>
  );
}

export default function Page() {
  return <App />;
}