import { useProgress } from "../shared/hooks/useProgress"

export function ProgressPanel() {
  const { progress, percent } = useProgress()

  if (!progress) {
    return <div className="status-text">Ready.</div>
  }

  return (
    <div className="progress-box">
      <div className="progress-info">
        <strong>{progress.stage}</strong>
        <span title={progress.current_file} style={{ 
          maxWidth: "400px",
          overflow: "hidden", 
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block"
        }}>
          {progress.current_file}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="progress-text">
        {progress.message}
      </div>
    </div>
  )
}

