import { useEffect, useState } from "react"
import { listen } from "@tauri-apps/api/event"

export interface ProgressEvent {
  job_id: string
  stage: string
  current: number
  total: number
  current_file: string
  message: string
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressEvent | null>(null)

  useEffect(() => {
    let unlisten: (() => void) | undefined

    listen<ProgressEvent>("minirar:progress", (e: { payload: ProgressEvent }) => {
      setProgress(e.payload)
    }).then((fn: () => void) => {
      unlisten = fn
    })

    return () => {
      unlisten?.()
    }
  }, [])

  const percent =
    progress && progress.total > 0
      ? Math.floor((progress.current / progress.total) * 100)
      : 0

  return { progress, percent }
}
