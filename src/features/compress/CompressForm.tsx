import type { CompressFormState } from "./compress.types"
import { Input, PathDropInput } from "../../shared/components"
import { PasswordInput } from "../../shared/components/PasswordInput"

interface Preset {
  name: string
  icon: string
  level: number
  description: string
}

const PRESETS: Preset[] = [
  { name: "Fast", icon: "⚡", level: 1, description: "Fastest, larger file" },
  { name: "Balanced", icon: "⚖️", level: 5, description: "Good balance" },
  { name: "Max", icon: "🗜️", level: 9, description: "Smallest file" },
  { name: "Store", icon: "📦", level: 0, description: "No compression" }
]

interface Props {
  value: CompressFormState
  onChange(value: CompressFormState): void
}

export function CompressForm({ value, onChange }: Props) {
  const currentPreset = PRESETS.find(p => p.level === value.level)
  
  return (
    <>
      <PathDropInput
        label="Input paths"
        paths={value.inputs}
        onChange={paths =>
          onChange({
            ...value,
            inputs: paths
          })
        }
      />

      <Input
        label="Output zip"
        value={value.outputZip}
        onChange={v => onChange({ ...value, outputZip: v })}
      />

      <div style={{ marginTop: "16px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "500", fontSize: "14px" }}>
          Compression Preset
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {PRESETS.map(preset => (
            <button
              key={preset.level}
              onClick={() => onChange({ ...value, level: preset.level })}
              style={{
                padding: "12px 8px",
                border: "2px solid",
                borderColor: currentPreset?.level === preset.level ? "#2563eb" : "#cbd5e1",
                borderRadius: "6px",
                background: currentPreset?.level === preset.level ? "#eff6ff" : "white",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: currentPreset?.level === preset.level ? "600" : "500",
                color: currentPreset?.level === preset.level ? "#1e40af" : "#333"
              }}
              title={preset.description}
            >
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{preset.icon}</div>
              <div style={{ fontSize: "12px" }}>{preset.name}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {currentPreset && (
            <>
              Selected: <strong>{currentPreset.name}</strong> (Level {currentPreset.level}) — {currentPreset.description}
            </>
          )}
        </div>
      </div>

      <label style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          checked={value.keepPaths}
          onChange={e =>
            onChange({
              ...value,
              keepPaths: e.target.checked
            })
          }
        />
        <span>Keep folder structure</span>
      </label>

      <PasswordInput
        value={value.password}
        onChange={pwd => onChange({ ...value, password: pwd })}
      />
    </>
  )
}

