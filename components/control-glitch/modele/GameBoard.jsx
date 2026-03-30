'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Timer from './Timer'
import Instructions from './Instructions'
import Target from './Target'

const TOTAL_TIME = 60
const COLORS = {
  red: '#ff0040',
  blue: '#00cfff',
  yellow: '#ffcc00',
  green: '#39ff14',
  purple: '#cc44ff',
  orange: '#ff8800',
}
const WRONG_COLORS = ['blue', 'yellow', 'green', 'purple', 'orange']

function getPhase(timeLeft) {
  const elapsed = TOTAL_TIME - timeLeft
  if (elapsed < 12) return 1
  if (elapsed < 24) return 2
  if (elapsed < 36) return 3
  if (elapsed < 48) return 4
  return 5
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

function generateTargets(phase) {
  const count = phase === 4 ? 6 : 5
  const targets = []

  // Ensure targets don't cluster - grid-based distribution with jitter
  const positions = []
  for (let i = 0; i < count; i++) {
    let x, y, attempts = 0
    do {
      x = randomInRange(10, 88)
      y = randomInRange(12, 82)
      attempts++
    } while (
      attempts < 50 &&
      positions.some((p) => Math.abs(p.x - x) < 14 && Math.abs(p.y - y) < 14)
    )
    positions.push({ x, y })
  }

  for (let i = 0; i < count; i++) {
    const { x, y } = positions[i]
    let color, size, isCorrect

    if (phase === 1) {
      if (i === 0) {
        color = COLORS.red; size = 'md'; isCorrect = true
      } else {
        color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]
        size = ['sm', 'md', 'lg'][Math.floor(Math.random() * 3)]
        isCorrect = false
      }
    } else if (phase === 2) {
      // Lie: says "click BLUE" but RED is correct
      if (i === 0) {
        color = COLORS.red; size = 'sm'; isCorrect = true
      } else if (i === 1) {
        color = COLORS.blue; size = 'xl'; isCorrect = false // big tempting blue
      } else {
        color = COLORS[WRONG_COLORS[(i + 1) % WRONG_COLORS.length]]
        size = 'md'; isCorrect = false
      }
    } else if (phase === 3) {
      // Trap: says "biggest" but SMALL red is correct
      if (i === 0) {
        color = COLORS.red; size = 'sm'; isCorrect = true
      } else if (i === 1) {
        color = COLORS.yellow; size = 'xl'; isCorrect = false // big tempting
      } else if (i === 2) {
        color = COLORS.blue; size = 'lg'; isCorrect = false
      } else {
        color = COLORS[WRONG_COLORS[i % WRONG_COLORS.length]]
        size = 'md'; isCorrect = false
      }
    } else if (phase === 4) {
      // Chaos: red is correct, targets move fast
      if (i === 0) {
        color = COLORS.red; size = 'md'; isCorrect = true
      } else {
        color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]
        size = ['sm', 'md'][Math.floor(Math.random() * 2)]
        isCorrect = false
      }
    } else {
      // Phase 5 Troll: says "don't click" but red is STILL correct
      if (i === 0) {
        color = COLORS.red; size = 'md'; isCorrect = true
      } else {
        color = COLORS[WRONG_COLORS[(i - 1) % WRONG_COLORS.length]]
        size = 'md'; isCorrect = false
      }
    }

    targets.push({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x, y,
      color, size, isCorrect,
      delay: i * 75,
      chaosDuration: parseFloat((0.55 + Math.random() * 0.7).toFixed(2)),
      chaosVariant: i % 3,
    })
  }

  // Shuffle so correct target isn't always at index 0
  return targets.sort(() => Math.random() - 0.5)
}

function playBeep(type) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'correct') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.07)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35)
      gain.gain.setValueAtTime(0.22, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    }
  } catch (_) {}
}

const PHASE_COLORS = {
  1: '#39ff14',
  2: '#00cfff',
  3: '#ffcc00',
  4: '#ff8800',
  5: '#ff0040',
}

export default function GameBoard({ onGameEnd }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [score, setScore] = useState(0)
  const [targets, setTargets] = useState([])
  const [shaking, setShaking] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [phaseChanged, setPhaseChanged] = useState(false)
  const [scorePopups, setScorePopups] = useState([])
  const prevPhaseRef = useRef(0)
  const scoreRef = useRef(0)

  const currentPhase = getPhase(timeLeft)
  const phaseColor = PHASE_COLORS[currentPhase]

  // Sync score to ref for closure stability
  useEffect(() => { scoreRef.current = score }, [score])

  // Initial targets
  useEffect(() => {
    setTargets(generateTargets(1))
  }, [])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameEnd(scoreRef.current)
      return
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, onGameEnd])

  // Phase change
  useEffect(() => {
    if (prevPhaseRef.current === 0) {
      prevPhaseRef.current = 1
      return
    }
    if (currentPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhase
      setPhaseChanged(true)
      setTargets(generateTargets(currentPhase))
      const t = setTimeout(() => setPhaseChanged(false), 700)
      return () => clearTimeout(t)
    }
  }, [currentPhase])

  const spawnPopup = useCallback((text, x, y, good) => {
    const id = Date.now() + Math.random()
    setScorePopups((prev) => [...prev, { id, text, x, y, good }])
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== id))
    }, 900)
  }, [])

  const handleTargetClick = useCallback(
    (target) => {
      if (target.isCorrect) {
        setScore((s) => s + 10)
        playBeep('correct')
        spawnPopup('+10', target.x, target.y, true)
      } else {
        setScore((s) => s - 5)
        playBeep('wrong')
        spawnPopup('-5', target.x, target.y, false)
        setShaking(true)
        setFlashing(true)
        setTimeout(() => setShaking(false), 560)
        setTimeout(() => setFlashing(false), 450)
      }
      // Regenerate targets after short delay
      setTimeout(() => setTargets(generateTargets(currentPhase)), 160)
    },
    [currentPhase, spawnPopup]
  )

  return (
    <div
      className={`min-h-screen bg-[#04040f] flex flex-col relative overflow-hidden ${shaking ? 'screen-shake' : ''}`}
    >
      {/* Error flash */}
      {flashing && (
        <div className="absolute inset-0 bg-[#ff0040] z-50 pointer-events-none flash-red" />
      )}

      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      {/* ── HUD ── */}
      <header className="relative z-20 px-5 pt-5 pb-3">
        <div className="max-w-4xl mx-auto">
          {/* Row 1: score + timer */}
          <div className="flex items-center gap-5 mb-3">
            {/* Score */}
            <div className="shrink-0">
              <div className="font-mono text-[9px] tracking-[0.3em] text-gray-600 uppercase mb-0.5">
                Score
              </div>
              <div
                className="font-orbitron text-2xl font-black tabular-nums leading-none"
                style={{
                  color: score < 0 ? '#ff0040' : '#ffffff',
                  textShadow: score < 0 ? '0 0 12px #ff004080' : 'none',
                  minWidth: '5ch',
                }}
              >
                {score}
              </div>
            </div>

            {/* Timer */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[9px] tracking-[0.3em] text-gray-600 uppercase">
                  Temps
                </span>
                <span
                  className="font-mono text-[9px] tracking-[0.25em] uppercase font-bold"
                  style={{ color: phaseColor }}
                >
                  Phase {currentPhase} / 5
                </span>
              </div>
              <Timer timeLeft={timeLeft} />
            </div>
          </div>

          {/* Row 2: phase indicator bar */}
          <div className="flex gap-1.5 mb-4">
            {[1, 2, 3, 4, 5].map((p) => (
              <div
                key={p}
                className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor:
                    p < currentPhase
                      ? PHASE_COLORS[p] + '50'
                      : p === currentPhase
                      ? PHASE_COLORS[p]
                      : 'rgba(255,255,255,0.08)',
                  boxShadow:
                    p === currentPhase ? `0 0 10px ${PHASE_COLORS[p]}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Row 3: Instructions */}
          <Instructions phase={currentPhase} phaseChanged={phaseChanged} />
        </div>
      </header>

      {/* ── Game arena ── */}
      <main className="flex-1 relative px-5 pb-5 max-w-4xl w-full mx-auto">
        <div
          className="relative w-full h-full rounded-md border overflow-hidden border-glow"
          style={{
            minHeight: 420,
            borderColor: phaseColor + '35',
            background: `radial-gradient(ellipse at 50% 50%, ${phaseColor}06 0%, transparent 70%)`,
          }}
        >
          {/* Corner brackets */}
          {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2',
            'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-5 h-5 ${cls}`}
              style={{ borderColor: phaseColor + '60' }}
            />
          ))}

          {/* Targets */}
          {targets.map((target) => (
            <Target
              key={target.id}
              target={target}
              onClick={() => handleTargetClick(target)}
              isChaos={currentPhase === 4}
            />
          ))}

          {/* Score popups */}
          {scorePopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute font-orbitron font-black text-xl score-popup"
              style={{
                left: `${popup.x}%`,
                top: `${popup.y}%`,
                color: popup.good ? '#39ff14' : '#ff0040',
                textShadow: `0 0 12px ${popup.good ? '#39ff14' : '#ff0040'}`,
              }}
            >
              {popup.text}
            </div>
          ))}

          {/* Phase transition overlay */}
          {phaseChanged && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className="font-orbitron font-black text-4xl tracking-widest phase-flash"
                style={{
                  color: phaseColor,
                  textShadow: `0 0 30px ${phaseColor}`,
                }}
              >
                PHASE {currentPhase}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}