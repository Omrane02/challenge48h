'use client'

import { useEffect, useState } from 'react'

const CHAOS_CLASSES = ['target-chaos-a', 'target-chaos-b', 'target-chaos-c']
const SIZE_MAP = { sm: 42, md: 62, lg: 86, xl: 112 }

export default function Target({ target, onClick, isChaos }) {
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const delay = target.delay ?? 0
    const t = setTimeout(() => setAppeared(true), delay)
    return () => clearTimeout(t)
  }, [target.delay, target.id])

  const size = SIZE_MAP[target.size] || 62
  const chaosClass = CHAOS_CLASSES[target.chaosVariant % 3]
  const animClass = isChaos ? chaosClass : 'target-pulse'

  return (
    <div
      style={{
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
        marginLeft: `-${size / 2}px`,
        marginTop: `-${size / 2}px`,
        opacity: appeared ? 1 : 0,
        transition: 'opacity 0.1s',
        '--dur': `${target.chaosDuration ?? 0.85}s`,
      }}
    >
      <button
        onClick={onClick}
        className={`relative rounded-full cursor-pointer focus:outline-none ${appeared ? 'target-appear' : ''} ${animClass}`}
        style={{
          width: size,
          height: size,
          backgroundColor: target.color,
          boxShadow: `0 0 18px ${target.color}90, 0 0 40px ${target.color}40`,
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      >
        {/* Inner ring */}
        <div
          className="absolute rounded-full border border-white/25"
          style={{ inset: '18%' }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full bg-white/40"
          style={{ inset: '38%' }}
        />
        {/* Glare */}
        <div
          className="absolute rounded-full bg-white/20"
          style={{ top: '10%', left: '15%', width: '35%', height: '25%', filter: 'blur(2px)' }}
        />
      </button>
    </div>
  )
}