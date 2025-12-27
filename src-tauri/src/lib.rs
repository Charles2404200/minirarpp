mod commands;

use std::sync::Mutex;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressRequest {
    pub job_id: String,
    pub inputs: Vec<String>,
    pub output_zip: String,
    pub level: u32,
    pub store_paths: bool,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractRequest {
    pub job_id: String,
    pub zip_path: String,
    pub output_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JobStatus {
    Pending,
    Running,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobInfo {
    pub id: String,
    pub job_type: String, // "compress" or "extract"
    pub status: JobStatus,
    pub progress: u32,
    pub total: u32,
    pub current_file: String,
    pub error: Option<String>,
}

pub struct AppState {
    pub jobs: Mutex<HashMap<String, JobInfo>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .manage(AppState {
      jobs: Mutex::new(HashMap::new()),
    })
    .invoke_handler(tauri::generate_handler![
      commands::start_compress,
      commands::start_extract,
      commands::cancel_job,
      commands::pause_job,
      commands::resume_job,
      commands::list_zip,
      commands::check_file_exists,
      commands::check_dir_has_files,
      commands::get_jobs,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
