'use client'

import { useEffect, useState } from 'react'

function getPerformance(score) {
  if (score > 250)
    return {
      grade: 'S',
      rank: 'UNHACKABLE',
      message: "Tu n'as pas cédé une seule fois. Le système ne peut rien contre toi.",
      color: '#39ff14',
    }
  if (score > 150)
    return {
      grade: 'A',
      rank: 'GLITCH MASTER',
      message: 'Le système a essayé fort. Tu as su résister à presque tout.',
      color: '#00cfff',
    }
  if (score > 70)
    return {
      grade: 'B',
      rank: 'RÉSISTANCE CORRECTE',
      message: "Quelques pièges t'ont eu, mais tu t'en es plutôt bien sorti.",
      color: '#ffcc00',
    }
  if (score > 10)
    return {
      grade: 'C',
      rank: 'FACILEMENT PIÉGÉ',
      message: 'Le glitch a bien joué avec ta tête. Tu as cru trop de choses.',
      color: '#ff8800',
    }
  if (score > -20)
    return {
      grade: 'D',
      rank: 'TROP CRÉDULE',
      message: "Tu as tout cru. Sans hésiter. Le système t'a possédé.",
      color: '#ff4400',
    }
  return {
    grade: 'F',
    rank: 'TOTAL CHAOS',
    message: "Le glitch a pris le contrôle total. Tu n'existais plus.",
    color: '#ff0040',
  }
}

const TIPS = [
  "Phase 2 : La vérité est le contraire de l'instruction.",
  'Phase 3 : Les petites cibles sont les bonnes.',
  'Phase 4 : Rouge reste correct malgré le chaos.',
  'Phase 5 : Clique quand même sur rouge.',
]

export default function EndScreen({ score, onReplay }) {
  const perf = getPerformance(score)
  const [visible, setVisible] = useState(false)
  const [countedScore, setCountedScore] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  // Animate score count-up / count-down
  useEffect(() => {
    if (!visible) return
    const steps = 40
    const step = score / steps
    let current = 0
    let i = 0
    const interval = setInterval(() => {
      i++
      current += step
      setCountedScore(Math.round(current))
      if (i >= steps) {
        setCountedScore(score)
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [visible, score])

  return (
    <div className="min-h-screen bg-[#04040f] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${perf.color}08 0%, transparent 65%)`,
        }}
      />

      {/* Animated corner lines */}
      <div
        className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 opacity-30"
        style={{ borderColor: perf.color }}
      />
      <div
        className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 opacity-30"
        style={{ borderColor: perf.color }}
      />
      <div
        className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 opacity-30"
        style={{ borderColor: perf.color }}
      />
      <div
        className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 opacity-30"
        style={{ borderColor: perf.color }}
      />

      <div
        className="relative z-10 text-center w-full max-w-lg transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Header */}
        <div className="font-mono text-xs tracking-[0.4em] text-gray-600 mb-8 uppercase">
          ▸ GAME OVER ◂
        </div>

        {/* Grade */}
        <div
          className="font-orbitron text-[9rem] font-black leading-none mb-2 glitch-grade select-none"
          style={{
            color: perf.color,
            textShadow: `0 0 60px ${perf.color}50`,
          }}
          data-text={perf.grade}
        >
          {perf.grade}
        </div>

        {/* Rank */}
        <div
          className="font-orbitron text-lg font-bold tracking-[0.15em] uppercase mb-3"
          style={{ color: perf.color }}
        >
          {perf.rank}
        </div>

        <p className="font-mono text-sm text-gray-400 leading-relaxed mb-10 max-w-xs mx-auto">
          {perf.message}
        </p>

        {/* Score box */}
        <div
          className="inline-block border rounded-sm px-12 py-6 mb-8"
          style={{ borderColor: perf.color + '40', background: perf.color + '06' }}
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-gray-600 mb-3 uppercase">
            Score Final
          </div>
          <div
            className="font-orbitron text-6xl font-black tabular-nums leading-none"
            style={{
              color: score < 0 ? '#ff0040' : '#ffffff',
              textShadow: score < 0 ? '0 0 20px #ff004080' : '0 0 20px rgba(255,255,255,0.2)',
            }}
          >
            {countedScore >= 0 ? countedScore : countedScore}
          </div>
          <div className="font-mono text-xs text-gray-600 mt-2">pts</div>
        </div>

        {/* Tips */}
        <div className="border border-white/5 rounded-sm p-4 mb-10 text-left bg-white/[0.02]">
          <div className="font-mono text-[10px] tracking-widest text-gray-600 mb-3 uppercase">
            💡 Secrets révélés
          </div>
          <ul className="space-y-1.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="font-mono text-xs text-gray-500 flex gap-2">
                <span style={{ color: perf.color }}>▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Replay button */}
        <button
          onClick={onReplay}
          className="group relative font-orbitron font-bold text-base tracking-widest uppercase px-14 py-4 border-2 transition-all duration-200 cursor-pointer"
          style={{
            borderColor: perf.color,
            color: perf.color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = perf.color
            e.currentTarget.style.color = '#04040f'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = perf.color
          }}
        >
          REJOUER
          <div
            className="absolute inset-0 translate-x-1.5 translate-y-1.5 -z-10 border opacity-20 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-200"
            style={{ borderColor: perf.color }}
          />
        </button>
      </div>
    </div>
  )
}