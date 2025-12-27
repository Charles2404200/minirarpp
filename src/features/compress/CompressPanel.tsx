import { useState } from "react"
import { ZipService } from "../../shared/services/zip.service"
import { useJob } from "../../shared/hooks/useJob"
import { Card } from "../../shared/components/Card"
import { Button } from "../../shared/components/Button"
import { TreeView } from "../../shared/components/TreeView"
import { CompressForm } from "./CompressForm"
import type { CompressFormState } from "./compress.types"
import type { FileNode } from "../../shared/types/tree.types"
import { buildFileTree, getSelectedPaths } from "../../shared/utils/treeUtils"
import { open } from "@tauri-apps/plugin-dialog"
import "./CompressPanel.css"

interface Props {
  setMode?: (mode: "compress" | "extract") => void
}

export function CompressPanel({ setMode: _setMode }: Props) {
  const { newJob } = useJob()
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [showTreeView, setShowTreeView] = useState(false)
  const [treeRoots, setTreeRoots] = useState<FileNode[]>([])
  const [excludePattern, setExcludePattern] = useState("")

  const [form, setForm] = useState<CompressFormState>({
    inputs: [],
    outputZip: "C:\\temp\\archive.zip",
    level: 6,
    keepPaths: true,
    password: ""
  })

  const showFileTreeView = async () => {
    if (!form.inputs || form.inputs.length === 0) {
      setError("Please add at least one file or folder first")
      return
    }
    setError("")
    const tree = buildFileTree(form.inputs)
    setTreeRoots(tree)
    setShowTreeView(true)
  }

  const handleTreeSelectionChange = (updated: FileNode[]) => {
    setTreeRoots(updated)
  }

  const closeTreeView = () => {
    setShowTreeView(false)
  }

  const applyTreeSelection = () => {
    const selectedPaths = getSelectedPaths(treeRoots)
    if (selectedPaths.length === 0) {
      setError("Please select at least one file")
      return
    }
    setForm(prev => ({ ...prev, inputs: selectedPaths }))
    setShowTreeView(false)
  }

  async function start() {
    setError("")
    setStatus("")

    // Validate inputs
    if (!form.inputs || form.inputs.length === 0) {
      setError("Please add at least one file or folder")
      return
    }

    if (!form.outputZip.trim()) {
      setError("Please specify output zip path")
      return
    }

    // Validate output path format
    const path = form.outputZip.trim()
    if (path.endsWith("\\") || path.endsWith("/")) {
      setError("Output path must be a file (e.g., D:\\output.zip), not a directory")
      return
    }

    if (!path.includes(".")) {
      setError("Output path must include filename with extension (e.g., D:\\output.zip)")
      return
    }

    if (!path.endsWith(".zip")) {
      setError("Output file must have .zip extension")
      return
    }

    // Check if output zip already exists
    try {
      const fileExists = await ZipService.checkFileExists(path)
      
      if (fileExists) {
        const confirmed = window.confirm(`File already exists: ${path}\n\nOverwrite?`)

        if (!confirmed) return
      }
    } catch (err) {
      console.warn("Could not check file existence:", err)
    }

    try {
      setStatus("Compressing...")
      const jobId = newJob()
      await ZipService.compress({
        job_id: jobId,
        inputs: form.inputs,
        output_zip: form.outputZip,
        level: form.level,
        store_paths: form.keepPaths
      })
      setStatus("✓ Compress completed successfully!")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Compress failed: ${message}`)
      console.error("Compress error:", err)
    }
  }

  const isStartDisabled = !form.inputs?.length || !form.outputZip.trim()

  const browseOutputFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false
    })

    if (selected && typeof selected === "string") {
      setForm(prev => ({
        ...prev,
        outputZip: `${selected}\\archive.zip`
      }))
    }
  }

  return (
    <Card title="Compress">
      <CompressForm value={form} onChange={setForm} />

      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "10px", fontSize: "12px", color: "#666" }}>
          Output location:
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={form.outputZip}
            onChange={e => setForm({ ...form, outputZip: e.target.value })}
            placeholder="D:\\output.zip"
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
            onClick={browseOutputFolder}
            style={{
              padding: "8px 16px",
              background: "#e2e8f0",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            📁 Pick Folder
          </button>
        </div>
      </div>

      {form.inputs.length > 0 && (
        <div style={{ marginTop: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "6px", borderLeft: "4px solid #0284c7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#333" }}>
               {form.inputs.length} file(s)/folder(s) selected
            </span>
            <Button 
              onClick={showFileTreeView}
            >
               View & Select Files
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Button onClick={start} disabled={isStartDisabled}>Start Compress</Button>
      </div>

      {status && <div style={{ color: "green", marginTop: "10px" }}>{status}</div>}
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

      {showTreeView && (
        <div className="tree-modal-overlay" onClick={closeTreeView}>
          <div className="tree-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tree-modal-header">
              <h3>📋 Select Files to Compress</h3>
              <button className="tree-modal-close" onClick={closeTreeView}>✕</button>
            </div>
            <div className="tree-modal-body">
              <TreeView
                roots={treeRoots}
                onSelectionChange={handleTreeSelectionChange}
                onExcludePatternChange={setExcludePattern}
                excludePattern={excludePattern}
              />
            </div>
            <div className="tree-modal-footer">
              <Button variant="secondary" onClick={closeTreeView}>Cancel</Button>
              <Button onClick={applyTreeSelection}>Apply Selection</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
