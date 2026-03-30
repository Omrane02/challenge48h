'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Level definitions — 'S' = player start, 'T' = target, '#' = wall, '.' = empty
// Row 0 and last row are always clear (guaranteed escape route via perimeter).
// ---------------------------------------------------------------------------
const LEVEL_DEFS = [
  {
    label: 'Niveau 1',
    subtitle: "L'Éveil",
    map: [
      '######',
      '#....#',
      'S.##.T',
      '#....#',
      '######',
    ],
  },
  {
    label: 'Niveau 2',
    subtitle: 'Premier Obstacle',
    map: [
      '########',
      '#...#..#',
      'S.#.#..T',
      '#......#',
      '########',
    ],
  },
  {
    label: 'Niveau 3',
    subtitle: 'Bifurcation',
    map: [
      '#########',
      '#.......#',
      '#.#####.#',
      'S.#...#.T',
      '#.#.#.#.#',
      '#...#...#',
      '#########',
    ],
  },
  {
    label: 'Niveau 4',
    subtitle: 'Double Mur',
    map: [
      '###########',
      '#.......#.#',
      '#.#####.#.#',
      'S.#...#.#.T',
      '#.#.#.#.#.#',
      '#...#.....#',
      '###########',
    ],
  },
  {
    label: 'Niveau 5',
    subtitle: 'Zigzag',
    map: [
      '#############',
      '#.........#.#',
      '#.#######.#.#',
      'S.#.....#.#.T',
      '###.###.#.#.#',
      '#...#...#...#',
      '#############',
    ],
  },
  {
    label: 'Niveau 6',
    subtitle: 'Les Chambres',
    map: [
      '#############',
      '#...#...#...#',
      '#.###.#.###.#',
      '#.....#.....#',
      'S.###.#.###.T',
      '#.#...#...#.#',
      '#.#.#####.#.#',
      '#.........#.#',
      '#############',
    ],
  },
  {
    label: 'Niveau 7',
    subtitle: 'Le Labyrinthe',
    map: [
      '###############',
      '#.......#.....#',
      '#.#####.#.###.#',
      '#.#...#.#.#...#',
      'S.#.#.#...#.#.T',
      '#.#.#.#####.#.#',
      '#.#.#.......#.#',
      '#...#########.#',
      '###############',
    ],
  },
  {
    label: 'Niveau 8',
    subtitle: 'Torsion',
    map: [
      '#################',
      '#...............#',
      '#.#############.#',
      '#.#.........#.#.#',
      'S.#.#######.#.#.T',
      '#.#.......#.#.#.#',
      '#.#########.#.#.#',
      '#...#...........#',
      '#################',
    ],
  },
  {
    label: 'Niveau 9',
    subtitle: 'Forteresse',
    map: [
      '#################',
      '#.......#.......#',
      '#.#####.#.#####.#',
      '#.#...#...#...#.#',
      '#.#.#.#####.#.#.#',
      'S...#.......#...T',
      '#####.#####.#####',
      '#.....#...#.....#',
      '#.#####.#.#####.#',
      '#.......#.......#',
      '#################',
    ],
  },
  {
    label: 'Niveau 10',
    subtitle: 'La Quête Finale',
    map: [
      '###################',
      '#...#.....#.......#',
      '#.#.#.###.#.#####.#',
      '#.#.#...#.#.#...#.#',
      '#.#.###.#.#.#.###.#',
      'S.#.....#...#.....T',
      '#.#####.#####.###.#',
      '#.....#.....#...#.#',
      '#.###.#####.###.#.#',
      '#...#.......#.....#',
      '###################',
    ],
  },
  {
    label: 'Niveau 11',
    subtitle: "L'Illusion",
    map: [
      '###################',
      '#.......#.........#',
      '#.#####.#.#######.#',
      '#.#...#.#.#.....#.#',
      '#.#.#.#.#.#.###.#.#',
      'S.#.#.#...#.#...#.T',
      '#.#.#.#####.#.###.#',
      '#.#.#.......#...#.#',
      '#.#######.#####.#.#',
      '#.........#.......#',
      '###################',
    ],
  },
  {
    label: 'Niveau 12',
    subtitle: 'Spirale Infernale',
    map: [
      '#####################',
      '##..................#',
      '#.#.###############.#',
      '#.#...............#.#',
      '#.#.#############.#.#',
      'S.#.#...........#.#.T',
      '#.#.#.#######.#.#.#.#',
      '#.#.#.#.....#.#.#.#.#',
      '#.#.#.###.#.#.#.#.#.#',
      '#.#.#...#.#.#.#.#.#.#',
      '#.#.###.###.#.#.#.#.#',
      '#.#.........#.#.#.#.#',
      '#.###########.#.#.#.#',
      '#.............#...#.#',
      '#####################',
    ],
  },
  {
    label: 'Niveau 13',
    subtitle: "L'Échiquier",
    map: [
      '#######################',
      '#...#.....#...#.......#',
      '#.#.#.###.#.#.#.#####.#',
      '#.#.#...#...#.#.#...#.#',
      '#.#.###.#####.#.#.###.#',
      'S.#...#.#.....#.#...#.T',
      '#.###.#.#.#####.###.#.#',
      '#...#...#.#...#...#.#.#',
      '###.#####.#.#####.#.#.#',
      '#.................#...#',
      '#######################',
    ],
  },
  {
    label: 'Niveau 14',
    subtitle: 'Dédale Obscur',
    map: [
      '#########################',
      '#...#.......#...#.......#',
      '#.#.#.#####.#.#.#.#####.#',
      '#.#.#.#.....#.#.#.#...#.#',
      '#.#.#.#.#.###.#.#.#.#.#.#',
      'S.#...#.#.....#...#.#.#.T',
      '#.#####.#.#########.#.#.#',
      '#.#...#.#.#.......#.#.#.#',
      '#.#.#.#.#.#.#####.#.#.#.#',
      '#...#...#.........#...#.#',
      '#########################',
    ],
  },
  {
    label: 'Niveau 15',
    subtitle: 'Le Cauchemar du Codeur',
    map: [
      '###########################',
      '#...........#...........#.#',
      '#.#########.#.########.##.#',
      '#.#.......#.#.#........##.#',
      '#.#.#####.#.#.#.#######.#.#',
      'S.#.#...#.#.#.#.#.......#.T',
      '#.#.#.#.#.#.#.#.#.###.#.#.#',
      '#.#.#.#.#.#.#.#.#.#...#.#.#',
      '#.#.#.#.###.#.#.###.###.#.#',
      '#.#...#.....#.#.....#....  .#',
      '#.#.#########.###########.#',
      '#.#.....................#.#',
      '###########################',
    ],
  },
{
    label: 'Niveau Bonus',
    subtitle: 'Challenge 48H YNOV (Version XXL)',
    map: [
      '#######################################################',
      '#.....................................................#',
      '######.#...#..###..#....#....#####.#...#.#####.######',
      '##.....#...#.#...#.#....#....#....##..#.#....#....#',
      '##.....#####.#####.#....#....#####.#.#.#.#.###.######',
      '##.....#...#.#...#.#....#....#....#..##.#...#.#....#',
      '######.#...#.#...#.#####.#####.#####.#...#.#####.######',
      '#.....................................................#',
      '####################################################..#',
      '#.....S.........................................T.....#',
      '#..####################################################',
      '#.....................................................#',
      '#.....#...#.#####.#...#...#...#.#...#.#####.#...#.....#',
      '#.....#...#.#...#.#...#...#...#.##..#.#...#.#...#.....#',
      '#.....#####.#####.#####....###..#.#.#.#...#.#...#.....#',
      '#.........#.#...#.#...#.....#...#..##.#...#..#.#......#',
      '#.........#.#####.#...#.....#...#...#.#####...#.......#',
      '#.....................................................#',
      '#######################################################',
    ],
  },
];

// ---------------------------------------------------------------------------
// Parse a level definition into a usable config
// ---------------------------------------------------------------------------
function parseLevel(def) {
  const rows = def.map.length
  const cols = def.map[0].length
  let playerStart = null
  let target = null
  const walls = new Set()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = def.map[r][c]
      if (ch === 'S') playerStart = { row: r, col: c }
      else if (ch === 'T') target = { row: r, col: c }
      else if (ch === '#') walls.add(`${r}-${c}`)
    }
  }

  return { ...def, rows, cols, playerStart, target, walls }
}

const LEVELS = LEVEL_DEFS.map(parseLevel)

// Cell size in px based on grid width
function cellSize(cols) {
  if (cols <= 8)  return 44
  if (cols <= 12) return 40
  if (cols <= 16) return 36
  return 32
}

const DIR_IMAGE = {
  right: '/player-h.svg',
  left:  '/player-h.svg',
  up:    '/player-v.svg',
  down:  '/player-v.svg',
}

const SECRET_LETTER = 'U'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuestGame({ onBack, onWin }) {
  const [levelIdx,   setLevelIdx]   = useState(0)
  const [pos,        setPos]        = useState(LEVELS[0].playerStart)
  const [dir,        setDir]        = useState('right')
  const [won,        setWon]        = useState(false)
  const [gameOver,   setGameOver]   = useState(false)  // all 10 done
  const [steps,      setSteps]      = useState(0)

  const level = LEVELS[levelIdx]

  // ---- reset to beginning of current level ----
  const resetLevel = useCallback((idx = levelIdx) => {
    setPos(LEVELS[idx].playerStart)
    setDir('right')
    setWon(false)
    setSteps(0)
  }, [levelIdx])

  // ---- advance to next level ----
  const nextLevel = useCallback(() => {
    const next = levelIdx + 1
    if (next >= LEVELS.length) {
      setGameOver(true)
      if (onWin) onWin()
    } else {
      setLevelIdx(next)
      resetLevel(next)
      setWon(false)
    }
  }, [levelIdx, resetLevel, onWin])

  // ---- restart from level 1 ----
  const restartGame = useCallback(() => {
    setLevelIdx(0)
    setGameOver(false)
    setWon(false)
    setPos(LEVELS[0].playerStart)
    setDir('right')
    setSteps(0)
  }, [])

  // ---- keyboard handler ----
  useEffect(() => {
    const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    const dirMap = {
      ArrowUp:    { dr: -1, dc:  0, dir: 'up'    },
      ArrowDown:  { dr:  1, dc:  0, dir: 'down'  },
      ArrowLeft:  { dr:  0, dc: -1, dir: 'left'  },
      ArrowRight: { dr:  0, dc:  1, dir: 'right' },
    }

    function handleKey(e) {
      if (e.key === 'Enter') {
        if (won) { nextLevel(); return }
        return
      }
      if (!KEYS.includes(e.key)) return
      e.preventDefault()
      if (won || gameOver) return

      const { dr, dc, dir: newDir } = dirMap[e.key]
      setDir(newDir)
      setPos(prev => {
        const row = prev.row + dr
        const col = prev.col + dc
        if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return prev
        if (level.walls.has(`${row}-${col}`)) return prev
        if (row === level.target.row && col === level.target.col) setWon(true)
        setSteps(s => s + 1)
        return { row, col }
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [won, gameOver, level, nextLevel])

  const cs = cellSize(level.cols)
  const playerImg = won ? '/player-arrow.svg' : DIR_IMAGE[dir]

  // ---- Game Complete screen ----
  if (gameOver) {
    return (
      <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap');`}</style>
      <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center gap-8 px-4">
        <Image src="/player-arrow.svg" alt="flèche" width={80} height={80} style={{ filter: 'drop-shadow(0 0 20px rgba(255,208,0,0.6))' }} />
        <div className="text-center space-y-2">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: '#ffd000', textShadow: '0 0 20px rgba(255,208,0,0.5)', letterSpacing: '0.15em' }}>VICTOIRE ABSOLUE</h1>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#555', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
            Les 10 niveaux ont été conquis.
          </p>
        </div>

        {/* Lettre secrète */}
        <div style={{ border: '1px solid rgba(255,208,0,0.45)', borderRadius: '14px', padding: '18px 48px', textAlign: 'center', boxShadow: '0 0 28px rgba(255,208,0,0.15)' }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#666', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', margin: '0 0 10px' }}>Lettre secrète</p>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '5rem', color: '#ffd000', textShadow: '0 0 28px rgba(255,208,0,0.6)', lineHeight: 1, display: 'block' }}>{SECRET_LETTER}</span>
        </div>

        <button
          onClick={restartGame}
          className="text-sm px-8 py-3 rounded transition-all tracking-widest uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#ffd000', border: '1px solid #ffd000', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffd000'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffd000'; }}
        >
          RECOMMENCER LA QUÊTE
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm px-8 py-3 rounded transition-all tracking-widest uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#555', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            ← ARCADE
          </button>
        )}
      </div>
      </>
    )
  }

  return (
    <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap');`}</style>
    <div className="min-h-screen bg-[#05050f] flex flex-col items-center justify-center gap-5 px-4 py-8">

      {/* ---- Header ---- */}
      <div className="text-center space-y-1">
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: '#ffd000', textShadow: '0 0 16px rgba(255,208,0,0.4)', letterSpacing: '0.15em' }}>
          La Quête de la Pointe
        </h1>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", color: '#444', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          flèches directionnelles pour avancer
        </p>
      </div>

      {/* ---- Level indicator ---- */}
      <div className="flex items-center gap-3">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < levelIdx
                ? 'bg-[#c8a000]'
                : i === levelIdx
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* ---- Level name ---- */}
      <div className="text-center">
        <span className="font-mono text-sm text-[#ffd000] font-semibold tracking-widest">
          {level.label}
        </span>
        <span className="font-mono text-xs text-zinc-500 ml-3 tracking-wide">
          — {level.subtitle}
        </span>
      </div>

      {/* ---- Legend ---- */}
      <div className="flex gap-5 items-center">
        <LegendItem src="/player-h.svg"     label="joueur"  />
        <LegendItem src="/target.svg"       label="cible"   />
        <LegendItem src="/wall.svg"         label="mur"     />
        <LegendItem src="/player-arrow.svg" label="flèche"  />
      </div>

      {/* ---- Grid ---- */}
      <div className="relative border border-zinc-800 bg-zinc-900 p-3 rounded-xl shadow-2xl shadow-black overflow-x-auto">

        {/* Victory overlay */}
        {won && (
          <div className="absolute inset-0 rounded-xl bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 px-8">
            <Image
              src="/player-arrow.svg"
              alt="flèche"
              width={60}
              height={60}
              className="drop-shadow-[0_0_14px_#34d399]"
            />
            <p className="font-mono text-lg font-bold text-[#ffd000] tracking-widest text-center">
              {levelIdx === LEVELS.length - 1 ? 'QUÊTE ACCOMPLIE !' : `${level.label} — Terminé !`}
            </p>
            <p className="font-mono text-xs text-zinc-500">{steps} pas</p>
            <button
              onClick={levelIdx === LEVELS.length - 1 ? () => setGameOver(true) : nextLevel}
              className="text-sm px-6 py-2 rounded transition-all tracking-widest uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#ffd000', border: '1px solid #ffd000', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffd000'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffd000'; }}
            >
              {levelIdx === LEVELS.length - 1 ? 'VICTOIRE FINALE' : 'NIVEAU SUIVANT →'}
            </button>
            <button
              onClick={() => resetLevel()}
              className="text-xs transition-colors tracking-wider"
              style={{ fontFamily: "'Share Tech Mono', monospace", color: '#444', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#888'}
              onMouseLeave={e => e.currentTarget.style.color = '#444'}
            >
              recommencer ce niveau
            </button>
          </div>
        )}

        {/* Cells */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, ${cs}px)`,
            gap: '2px',
          }}
        >
          {Array.from({ length: level.rows }, (_, r) =>
            Array.from({ length: level.cols }, (_, c) => {
              const isPlayer = pos.row === r && pos.col === c
              const isTarget = level.target.row === r && level.target.col === c && !won
              const isWall   = level.walls.has(`${r}-${c}`)

              return (
                <div
                  key={`${r}-${c}`}
                  style={{ width: cs, height: cs }}
                  className="flex items-center justify-center"
                >
                  {isPlayer && (
                    <Image
                      src={playerImg}
                      alt="joueur"
                      width={cs - 6}
                      height={cs - 6}
                      className={won ? 'drop-shadow-[0_0_6px_#34d399]' : ''}
                      priority
                    />
                  )}
                  {!isPlayer && isTarget && (
                    <Image src="/target.svg" alt="cible" width={cs - 6} height={cs - 6} />
                  )}
                  {!isPlayer && isWall && (
                    <Image src="/wall.svg" alt="mur" width={cs - 4} height={cs - 4} />
                  )}
                  {!isPlayer && !isTarget && !isWall && (
                    <span
                      className="rounded-full bg-zinc-800 opacity-30"
                      style={{ width: cs * 0.18, height: cs * 0.18 }}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ---- Footer controls ---- */}
      <div className="flex items-center gap-6">
        <p className="font-mono text-xs text-zinc-700">
          pos ({pos.col},{pos.row}) · {steps} pas
        </p>
        <button
          onClick={() => resetLevel()}
          className="font-mono text-xs px-4 py-1.5 rounded border border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors tracking-widest"
        >
          [ RESET ]
        </button>
      </div>

    </div>
    </>
  )
}

function LegendItem({ src, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Image src={src} alt={label} width={20} height={20} />
      <span className="font-mono text-xs text-zinc-500">{label}</span>
    </div>
  )
}
