import { useState } from "react"
import { generateUUID } from "../../utils/uuid"

export function useJob() {
  const [jobId, setJobId] = useState(generateUUID())

  const newJob = () => {
    const id = generateUUID()
    setJobId(id)
    return id
  }

  return { jobId, newJob }
}
