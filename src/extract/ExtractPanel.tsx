import { useState, useEffect } from "react"
import { useJob } from "../shared/hooks/useJob"
import { ZipService } from "../shared/services/zip.service"
import { Card } from "../shared/components/Card"
import { Button } from "../shared/components/Button"
import { ExtractForm } from "./ExtractForm"
import type { ExtractFormState } from "./extract.types"
import { open } from "@tauri-apps/plugin-dialog"

interface Props {
  setMode: (mode: "compress" | "extract") => void
}

export function ExtractPanel({ setMode }: Props) {
  const { newJob } = useJob()
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const [form, setForm] = useState<ExtractFormState>({
    zipPath: "",
    outputDir: "",
    overwrite: false,
    extractHere: false,
    createSubfolder: true
  })

  // Auto-fill output folder when zip path changes
  useEffect(() => {
    if (form.zipPath) {
      if (form.extractHere) {
        // Extract here - use same directory as zip
        const zipDir = form.zipPath.substring(0, form.zipPath.lastIndexOf("\\"))
        setForm(prev => ({
          ...prev,
          outputDir: zipDir
        }))
      } else {
        // Extract to subfolder with zip name
        const zipName = form.zipPath.split("\\").pop() || form.zipPath
        const nameWithoutExt = zipName.replace(/\.[^/.]+$/, "")
        const zipDir = form.zipPath.substring(0, form.zipPath.lastIndexOf("\\")) || "."
        const suggestedPath = `${zipDir}\\${nameWithoutExt}`
        
        setForm(prev => ({
          ...prev,
          outputDir: suggestedPath
        }))
      }
    }
  }, [form.zipPath, form.extractHere])

  async function start() {
    setError("")
    setStatus("")

    // Validate
    if (!form.zipPath.trim()) {
      setError("Please select a zip file")
      return
    }

    if (!form.outputDir.trim()) {
      setError("Please specify output folder")
      return
    }

    // Check if output directory exists and has files
    try {
      const dirExists = await ZipService.checkFileExists(form.outputDir)
      
      if (dirExists) {
        const hasFiles = await ZipService.checkDirHasFiles(form.outputDir)
        if (hasFiles) {
          // Directory has files, ask for confirmation
          const confirmed = window.confirm('Output folder is not empty. Click OK to overwrite or Cancel to skip.')
          if (!confirmed) return
        }
      }
    } catch (err) {
      console.warn("Could not check directory:", err)
    }

    // Calculate final output path
    let finalOutputPath = form.outputDir
    
    if (form.createSubfolder) {
      // Add subfolder with zip name
      const zipName = form.zipPath.split("\\").pop() || form.zipPath
      const nameWithoutExt = zipName.replace(/\.[^/.]+$/, "")
      finalOutputPath = `${form.outputDir}\\${nameWithoutExt}`
    }

    try {
      setStatus("Extracting...")
      const jobId = newJob()
      await ZipService.extract({
        job_id: jobId,
        zip_path: form.zipPath,
        output_dir: finalOutputPath
      })
      setStatus("✓ Extract completed successfully!")
      
      // Reset form
      setTimeout(() => {
        setForm({
          zipPath: "",
          outputDir: "",
          overwrite: false,
          extractHere: false,
          createSubfolder: true
        })
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Extract failed: ${message}`)
      console.error("Extract error:", err)
    }
  }

  const isStartDisabled = !form.zipPath.trim() || !form.outputDir.trim()

  return (
    <Card title="Extract">
      <ExtractForm 
        value={form} 
        onChange={setForm}
        onZipSelected={() => setMode("extract")}
      />

      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "10px", fontSize: "12px", color: "#666" }}>
          Extract to:
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={form.outputDir}
            onChange={e => setForm({ ...form, outputDir: e.target.value })}
            placeholder="Select output folder..."
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
            onClick={async () => {
              const selected = await open({
                directory: true,
                multiple: false
              })
              if (selected && typeof selected === "string") {
                setForm(prev => ({
                  ...prev,
                  outputDir: selected
                }))
              }
            }}
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

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Button onClick={start} disabled={isStartDisabled}>Extract</Button>
        <Button variant="secondary" onClick={() => setForm({
          zipPath: "",
          outputDir: "",
          overwrite: false,
          extractHere: false,
          createSubfolder: true
        })}>
          Clear
        </Button>
      </div>

      {status && <div style={{ color: "green", marginTop: "10px" }}>{status}</div>}
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
    </Card>
  )
}
