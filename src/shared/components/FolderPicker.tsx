import { open } from "@tauri-apps/plugin-dialog"

interface Props {
  label?: string
  value: string
  onChange: (path: string) => void
}

export function FolderPicker({ label, value, onChange }: Props) {
  const browse = async () => {
    const selected = await open({
      directory: true,
      multiple: false
    })

    if (selected && typeof selected === "string") {
      onChange(selected)
    }
  }

  const clear = () => onChange("")

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label>{label}</label>}

      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Select a folder..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "14px",
            fontFamily: "monospace"
          }}
        />
        <button
          onClick={browse}
          style={{
            padding: "8px 16px",
            background: "#e2e8f0",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "background 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.background = "#cbd5e1")}
          onMouseOut={e => (e.currentTarget.style.background = "#e2e8f0")}
        >
          Browse…
        </button>
        {value && (
          <button
            onClick={clear}
            style={{
              padding: "8px 12px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            ❌
          </button>
        )}
      </div>

      {value && (
        <div
          style={{
            marginTop: 8,
            padding: "8px",
            background: "#f8fafc",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#475569",
            wordBreak: "break-all"
          }}
        >
          {value}
        </div>
      )}
    </div>
  )
}
