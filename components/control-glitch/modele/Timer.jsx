'use client'

export default function Timer({ timeLeft, totalTime = 60 }) {
  const percentage = (timeLeft / totalTime) * 100
  const isLow = timeLeft <= 10
  const isCritical = timeLeft <= 5

  const barColor = isCritical
    ? '#ff0040'
    : isLow
    ? 'linear-gradient(90deg, #ff8800, #ff0040)'
    : 'linear-gradient(90deg, #39ff14, #00cfff)'

  return (
    <div className="flex items-center gap-4 w-full">
      <div
        className="font-orbitron text-3xl font-black tabular-nums leading-none min-w-[3ch]"
        style={{
          color: isCritical ? '#ff0040' : isLow ? '#ff8800' : '#ffffff',
          animation: isCritical ? 'target-pulse 0.6s ease-in-out infinite' : 'none',
          textShadow: isCritical ? '0 0 20px #ff0040' : 'none',
        }}
      >
        {String(timeLeft).padStart(2, '0')}
      </div>

      <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percentage}%`,
            background: barColor,
            boxShadow: isCritical
              ? '0 0 8px #ff0040'
              : isLow
              ? '0 0 8px #ff8800'
              : '0 0 8px #39ff14',
          }}
        />

        {/* Tick marks */}
        {[20, 40, 60, 80].map((p) => (
          <div
            key={p}
            className="absolute top-0 bottom-0 w-px bg-white/10"
            style={{ left: `${p}%` }}
          />
        ))}
      </div>
    </div>
  )
}