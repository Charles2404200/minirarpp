import { MainLayout } from "./layout/MainLayout"
import { CompressPanel } from "../features/compress/CompressPanel"
import { ExtractPanel } from "../extract/ExtractPanel"
import { ProgressPanel } from "../progress/ProgressPanel"
import JobQueuePanel from "../progress/JobQueuePanel"

export default function App() {
  return (
    <MainLayout
      compress={(setMode) => <CompressPanel setMode={setMode} />}
      extract={(setMode) => <ExtractPanel setMode={setMode} />}
      progress={<>
        <ProgressPanel />
        <JobQueuePanel />
      </>}
    />
  )
}
