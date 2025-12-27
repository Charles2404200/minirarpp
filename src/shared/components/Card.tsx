import type { ReactNode } from "react"

interface Props {
  title?: string
  children: ReactNode
}

export function Card({ title, children }: Props) {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  )
}
