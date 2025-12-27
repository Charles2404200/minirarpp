import type { ExtractFormState } from "./extract.types"
import { Input, PathDropInput } from "../shared/components"

interface Props {
  value: ExtractFormState
  onChange(value: ExtractFormState): void
  onZipSelected?: () => void
}

export function ExtractForm({ value, onChange, onZipSelected }: Props) {
  return (
    <>
      <PathDropInput
        label="Zip file"
        paths={value.zipPath ? [value.zipPath] : []}
        zipOnly={true}
        onZipDrop={onZipSelected}
        onChange={paths => {
          onChange({
            ...value,
            zipPath: paths[0] || ""
          })
        }}
      />

      <Input
        label="Extract to"
        value={value.outputDir}
        onChange={v => onChange({ ...value, outputDir: v })}
        placeholder="Will auto-fill based on zip name"
      />

      <label style={{ marginTop: "15px" }}>
        <input
          type="checkbox"
          checked={value.extractHere}
          onChange={e =>
            onChange({
              ...value,
              extractHere: e.target.checked
            })
          }
        />{" "}
        Extract here (in same folder as zip)
      </label>

      <label style={{ marginTop: "10px" }}>
        <input
          type="checkbox"
          checked={value.createSubfolder}
          onChange={e =>
            onChange({
              ...value,
              createSubfolder: e.target.checked
            })
          }
        />{" "}
        Create subfolder with archive name
      </label>

      <label style={{ marginTop: "10px" }}>
        <input
          type="checkbox"
          checked={value.overwrite}
          onChange={e =>
            onChange({
              ...value,
              overwrite: e.target.checked
            })
          }
        />{" "}
        Overwrite existing files
      </label>
    </>
  )
}
