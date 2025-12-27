import { useCallback } from "react"
import type { DragEvent } from "react"
import { open } from '@tauri-apps/plugin-dialog'

interface Props {
  label?: string
  paths: string[]
  onChange: (paths: string[]) => void
  zipOnly?: boolean
  onZipDrop?: () => void
}

export function PathDropInput({ label, paths, onChange, zipOnly = false, onZipDrop }: Props) {
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()

      // File API không có thuộc tính path, chỉ có name
      let dropped = Array.from(e.dataTransfer.files).map(
        f => ("path" in f ? (f as any).path : f.name)
      )

      // Filter .zip files if needed
      if (zipOnly) {
        dropped = dropped.filter(f => f.endsWith(".zip"))
        if (dropped.length > 0 && onZipDrop) {
          onZipDrop()
        }
      }

      const merged = Array.from(new Set([...paths, ...dropped]))
      onChange(merged)
    },
    [paths, onChange, zipOnly, onZipDrop]
  )

  const browse = async () => {
    const selected = await open({
      multiple: zipOnly ? false : true,
      directory: zipOnly ? false : false,
      filters: zipOnly ? [{ name: "ZIP", extensions: ["zip"] }] : []
    })

    if (!selected) return

    const arr = Array.isArray(selected) ? selected : [selected]
    
    if (zipOnly && onZipDrop && arr.length > 0) {
      onZipDrop()
    }

    const merged = Array.from(new Set([...paths, ...arr]))
    onChange(merged)
  }

  const remove = (p: string) => {
    onChange(paths.filter(x => x !== p))
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label>{label}</label>}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: 8,
          padding: 16,
          textAlign: "center",
          background: "#f8fafc",
          marginTop: 6
        }}
      >
        <div style={{ marginBottom: 8 }}>
          {zipOnly ? "Drag & drop ZIP file here" : "Drag & drop files or folders here"}
        </div>
        <button type="button" onClick={browse}>
          Browse…
        </button>
      </div>

      {/* List */}
      {paths.length > 0 && (
        <ul style={{ marginTop: 10, paddingLeft: 0, listStyle: "none" }}>
          {paths.map(p => (
            <li
              key={p}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 13
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "85%"
                }}
                title={p}
              >
                {p}
              </span>
              <button onClick={() => remove(p)}>❌</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
