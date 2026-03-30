'use client'

const PHASE_DATA = {
  1: {
    label: 'PHASE NORMALE',
    instruction: 'Clique sur la cible ROUGE',
    sub: "Suis les instructions. Simple. Pour l'instant.",
    color: '#39ff14',
    icon: '◉',
  },
  2: {
    label: 'MENSONGE ACTIVÉ',
    instruction: 'Clique sur la cible BLEUE',
    sub: 'Est-ce vraiment la vérité ? Réfléchis bien...',
    color: '#00cfff',
    icon: '⚠',
  },
  3: {
    label: 'PIÈGE TENDU',
    instruction: 'Clique sur la cible la plus GROSSE',
    sub: "Plus c'est gros, mieux c'est... vraiment ?",
    color: '#ffcc00',
    icon: '⊗',
  },
  4: {
    label: 'MODE CHAOS',
    instruction: 'Clique sur la cible ROUGE',
    sub: 'Les cibles bougent. Reste concentré.',
    color: '#ff8800',
    icon: '✦',
  },
  5: {
    label: 'PHASE TROLL',
    instruction: 'NE CLIQUE SUR RIEN. RIEN DU TOUT.',
    sub: 'Vraiment. Arrête-toi. Le jeu est terminé.',
    color: '#ff0040',
    icon: '✕',
  },
}

export default function Instructions({ phase, phaseChanged }) {
  const data = PHASE_DATA[phase] || PHASE_DATA[1]

  return (
    <div className={`text-center ${phaseChanged ? 'phase-flash' : ''}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span
          className="font-mono text-xs tracking-[0.25em] uppercase px-2 py-0.5 rounded-sm border"
          style={{
            color: data.color,
            borderColor: data.color + '50',
            backgroundColor: data.color + '10',
          }}
        >
          {data.icon} {data.label}
        </span>
      </div>

      <p
        className="font-orbitron text-xl md:text-2xl font-bold leading-tight"
        style={{ color: '#ffffff' }}
      >
        {data.instruction}
      </p>

      <p className="font-mono text-xs text-gray-500 mt-1 tracking-wide">
        {data.sub}
      </p>
    </div>
  )
}