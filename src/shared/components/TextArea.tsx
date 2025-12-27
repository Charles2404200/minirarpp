interface TextAreaProps {
  label?: string
  value: string
  rows?: number
  placeholder?: string
  onChange: (value: string) => void
}

export function TextArea({
  label,
  value,
  rows = 4,
  placeholder,
  onChange
}: TextAreaProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 4 }}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #ccc",
          resize: "vertical"
        }}
      />
    </div>
  )
}
