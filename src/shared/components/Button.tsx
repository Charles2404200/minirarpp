import type { ReactNode } from "react"

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "danger" | "secondary"
  disabled?: boolean
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false
}: ButtonProps) {
  const baseStyle =
    "px-4 py-2 rounded-md font-medium transition-colors"

  const variants: Record<string, string> = {
    primary: "bg-black text-white hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-gray-300 text-black hover:bg-gray-400"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  )
}
