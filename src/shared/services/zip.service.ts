import { invoke } from "@tauri-apps/api/core"

export interface CompressRequest {
  job_id: string
  inputs: string[]
  output_zip: string
  level: number
  store_paths: boolean
}

export interface ExtractRequest {
  job_id: string
  zip_path: string
  output_dir: string
}

export const JobStatus = {
  Pending: "Pending",
  Running: "Running",
  Paused: "Paused",
  Completed: "Completed",
  Failed: "Failed",
  Cancelled: "Cancelled",
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export interface JobInfo {
  id: string
  job_type: string
  status: JobStatus
  progress: number
  total: number
  current_file: string
  error: string | null
}

export const ZipService = {
  compress(req: CompressRequest) {
    return invoke("start_compress", { req })
  },

  extract(req: ExtractRequest) {
    return invoke("start_extract", { req })
  },

  cancelJob(jobId: string) {
    return invoke("cancel_job", { jobId })
  },

  pauseJob(jobId: string) {
    return invoke("pause_job", { jobId })
  },

  resumeJob(jobId: string) {
    return invoke("resume_job", { jobId })
  },

  getJobs() {
    return invoke<JobInfo[]>("get_jobs")
  },

  list(zipPath: string) {
    return invoke("list_zip", { zipPath })
  },

  checkFileExists(path: string) {
    return invoke<boolean>("check_file_exists", { path })
  },

  checkDirHasFiles(path: string) {
    return invoke<boolean>("check_dir_has_files", { path })
  }
}
