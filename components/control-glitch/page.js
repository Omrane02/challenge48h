import App from './App'

export const metadata = {
  title: 'Control Glitch',
  description: "Un mini-jeu de 60 secondes où rien n'est ce qu'il semble.",
}

export default function ControlGlitchPage() {
  return (
    <main className="min-h-screen bg-[#04040f]">
      <App />
    </main>
  )
}