import type { ReactNode } from "react"
import { useState } from "react"

type Mode = "compress" | "extract"

interface Props {
  compress: (setMode: (mode: Mode) => void) => ReactNode
  extract: (setMode: (mode: Mode) => void) => ReactNode
  progress: ReactNode
}

export function MainLayout({ compress, extract, progress }: Props) {
  const [mode, setMode] = useState<Mode>("compress")

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">MiniRAR++</h2>

        <button
          className={mode === "compress" ? "nav active" : "nav"}
          onClick={() => setMode("compress")}
        >
           Compress
        </button>

        <button
          className={mode === "extract" ? "nav active" : "nav"}
          onClick={() => setMode("extract")}
        >
           Extract
        </button>
      </aside>

      {/* Main */}
      <main className="main">
        <section className="content">
          {mode === "compress" ? compress(setMode) : extract(setMode)}
        </section>

        <footer className="status">
          {progress}
        </footer>
      </main>
    </div>
  )
}
