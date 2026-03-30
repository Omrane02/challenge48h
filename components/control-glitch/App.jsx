'use client'

import { useState } from 'react'
import GameBoard from './modele/GameBoard'
import EndScreen from './modele/EndScreen'
import './glitch.css'

export default function App() {
  const [gameState, setGameState] = useState('home') // 'home' | 'playing' | 'ended'
  const [finalScore, setFinalScore] = useState(0)

  function handleGameEnd(score) {
    setFinalScore(score)
    setGameState('ended')
  }

  if (gameState === 'playing') {
    return <GameBoard onGameEnd={handleGameEnd} />
  }

  if (gameState === 'ended') {
    return <EndScreen score={finalScore} onReplay={() => setGameState('home')} />
  }

  return (
    <div className="min-h-screen bg-[#04040f] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Ambient glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,0,64,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 text-center px-6 w-full max-w-2xl">
        {/* System header */}
        <div className="font-mono text-[10px] tracking-[0.4em] text-gray-600 uppercase mb-6">
          ▶ SYSTEM_OVERRIDE · v2.7.1 · INFILTRATION EN COURS
        </div>

        {/* Glitch title */}
        <div className="mb-10">
          <h1
            className="font-orbitron text-7xl md:text-9xl font-black text-white leading-none glitch-title select-none"
            data-text="CONTROL"
          >
            CONTROL
          </h1>
          <h1
            className="font-orbitron text-7xl md:text-9xl font-black leading-none select-none glitch-title-red"
            style={{ marginTop: '-0.05em' }}
            data-text="GLITCH"
          >
            GLITCH
          </h1>
        </div>

        {/* Description */}
        <p className="font-mono text-sm text-gray-400 leading-relaxed mb-10 max-w-md mx-auto">
          60 secondes. 5 phases. Les règles changent à chaque fois.{' '}
          <span style={{ color: '#ff0040' }}>Ne faites confiance à aucune instruction.</span>
        </p>

        {/* Phase preview cards */}
        <div className="grid grid-cols-5 gap-2 mb-10">
          {[
            { num: '01', name: 'NORMAL', color: '#39ff14', icon: '◉' },
            { num: '02', name: 'MENSONGE', color: '#00cfff', icon: '⚠' },
            { num: '03', name: 'PIÈGE', color: '#ffcc00', icon: '⊗' },
            { num: '04', name: 'CHAOS', color: '#ff8800', icon: '✦' },
            { num: '05', name: 'TROLL', color: '#ff0040', icon: '✕' },
          ].map((p) => (
            <div
              key={p.num}
              className="border rounded-sm p-2.5 text-center transition-all duration-200 hover:bg-white/5 cursor-default"
              style={{
                borderColor: p.color + '30',
                background: p.color + '06',
              }}
            >
              <div className="font-mono text-base mb-1" style={{ color: p.color }}>
                {p.icon}
              </div>
              <div className="font-mono text-[9px] text-gray-600 mb-1">{p.num}</div>
              <div
                className="font-mono text-[9px] font-bold tracking-wider"
                style={{ color: p.color + 'cc' }}
              >
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="relative inline-block mb-8">
          <button
            onClick={() => setGameState('playing')}
            className="group relative font-orbitron font-bold text-lg md:text-xl tracking-widest uppercase px-14 py-4 border-2 transition-all duration-200 cursor-pointer"
            style={{
              borderColor: '#39ff14',
              color: '#39ff14',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#39ff14'
              e.currentTarget.style.color = '#04040f'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#39ff14'
            }}
          >
            LANCER LE JEU
            <div
              className="absolute inset-0 translate-x-2 translate-y-2 -z-10 border border-[#39ff14]/25 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-200"
            />
          </button>
        </div>

        {/* Score rules */}
        <div className="flex items-center justify-center gap-8 font-mono text-xs text-gray-600">
          <span>
            ✓ Bon clic{' '}
            <span style={{ color: '#39ff14' }} className="font-bold">
              +10 pts
            </span>
          </span>
          <span className="text-gray-700">·</span>
          <span>
            ✗ Erreur{' '}
            <span style={{ color: '#ff0040' }} className="font-bold">
              -5 pts
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}