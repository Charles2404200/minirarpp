interface InputProps {
  label?: string
  value: string | number
  type?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function Input({
  label,
  value,
  type = "text",
  placeholder,
  onChange
}: InputProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #ccc"
        }}
      />
    </div>
  )
}
