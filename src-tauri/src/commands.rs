use crate::{CompressRequest, ExtractRequest, AppState, JobInfo, JobStatus};
use std::fs;
use std::path::Path;
use std::io::Write;
use tauri::{State, Emitter};
use zip::ZipWriter;
use zip::write::FileOptions;
use zip::CompressionMethod;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub job_id: String,
    pub stage: String,
    pub current: u32,
    pub total: u32,
    pub current_file: String,
    pub message: String,
}

fn emit_progress(
    app: &tauri::AppHandle,
    job_id: &str,
    stage: &str,
    current: u32,
    total: u32,
    current_file: &str,
    elapsed_secs: u64,
    state: &tauri::State<AppState>,
) {
    let percent = if total > 0 {
        ((current as f64 / total as f64) * 100.0) as u32
    } else {
        0
    };

    let message = format!("{}% — {}/{} files — {}", percent, current, total, format_time(elapsed_secs));

    let _ = app.emit("minirar:progress", ProgressEvent {
        job_id: job_id.to_string(),
        stage: stage.to_string(),
        current,
        total,
        current_file: current_file.to_string(),
        message,
    });

    // Update job info in state
    let mut jobs = state.jobs.lock().unwrap();
    if let Some(job) = jobs.get_mut(job_id) {
        job.progress = current;
        job.total = total;
        job.current_file = current_file.to_string();
    }
}

fn format_time(secs: u64) -> String {
    let minutes = secs / 60;
    let seconds = secs % 60;
    format!("{}:{:02}", minutes, seconds)
}

fn check_and_wait_for_pause(job_id: &str, state: &tauri::State<AppState>) -> Result<bool, String> {
    loop {
        let jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get(job_id) {
            match job.status {
                JobStatus::Cancelled => return Err("Job was cancelled".to_string()),
                JobStatus::Paused => {
                    drop(jobs); // Release lock before sleeping
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    continue;
                }
                JobStatus::Running => return Ok(false),
                _ => return Ok(false),
            }
        } else {
            return Err("Job not found".to_string());
        }
    }
}

fn count_files(paths: &[String]) -> Result<u32, String> {
    let mut count = 0;
    
    for path_str in paths {
        let path = Path::new(path_str);
        if path.is_file() {
            count += 1;
        } else if path.is_dir() {
            for entry in walkdir::WalkDir::new(path)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.path().is_file() {
                    count += 1;
                }
            }
        }
    }
    
    Ok(count)
}

#[tauri::command]
pub async fn start_compress(
    req: CompressRequest,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let start_time = Instant::now();
    
    // Add job to queue
    {
        let mut jobs = state.jobs.lock().unwrap();
        jobs.insert(req.job_id.clone(), JobInfo {
            id: req.job_id.clone(),
            job_type: "compress".to_string(),
            status: JobStatus::Running,
            progress: 0,
            total: 0,
            current_file: String::new(),
            error: None,
        });
    }

    // Validate output path
    if req.output_zip.is_empty() {
        return Err("Output zip path cannot be empty".to_string());
    }

    let output_path = std::path::Path::new(&req.output_zip);
    
    // Check if path ends with separator (is a directory, not a file)
    if req.output_zip.ends_with('\\') || req.output_zip.ends_with('/') {
        return Err("Output path must be a file path, not a directory. Example: D:\\archive.zip".to_string());
    }
    
    // Check if path has a filename with extension
    if output_path.file_name().is_none() || !req.output_zip.contains('.') {
        return Err("Output path must include a filename with .zip extension. Example: D:\\archive.zip".to_string());
    }

    // Count total files
    let total_files = count_files(&req.inputs)?;
    let mut current_file_count = 0;

    // Create parent directory if needed
    if let Some(parent) = output_path.parent() {
        if parent.as_os_str().len() > 0 && parent != std::path::Path::new("") {
            // Try to create, ignore errors for root paths
            let _ = fs::create_dir_all(parent);
        }
    }

    // Create zip file
    let file = fs::File::create(&req.output_zip)
        .map_err(|e| format!("Failed to create zip file at {}: {}", req.output_zip, e))?;

    let mut zip = ZipWriter::new(file);

    // Add files to zip
    for input_path in &req.inputs {
        // Check for pause/cancel
        check_and_wait_for_pause(&req.job_id, &state)?;
        
        let path = Path::new(input_path);
        
        if path.is_file() {
            current_file_count += 1;
            let elapsed = start_time.elapsed().as_secs();
            emit_progress(&app, &req.job_id, "Compressing", current_file_count, total_files, 
                         input_path, elapsed, &state);
            add_file_to_zip(&mut zip, path, req.store_paths, &req.output_zip, req.password.as_deref())?;
        } else if path.is_dir() {
            add_dir_to_zip_with_progress(&mut zip, path, req.store_paths, &req.output_zip, 
                                        &req.job_id, &app, &start_time, &mut current_file_count, total_files, &state, req.password.as_deref())?;
        } else {
            return Err(format!("Path not found: {}", input_path));
        }
    }

    zip.finish().map_err(|e| format!("Failed to finalize zip: {}", e))?;

    // Final progress update
    let elapsed = start_time.elapsed().as_secs();
    emit_progress(&app, &req.job_id, "Compressing", total_files, total_files, 
                 "Done", elapsed, &state);

    // Mark job as completed
    {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&req.job_id) {
            job.status = JobStatus::Completed;
        }
    }

    Ok(())
}

fn add_dir_to_zip_with_progress(
    zip: &mut zip::ZipWriter<fs::File>,
    dir_path: &Path,
    store_paths: bool,
    _output_zip: &str,
    job_id: &str,
    app: &tauri::AppHandle,
    start_time: &Instant,
    current_count: &mut u32,
    total_files: u32,
    state: &tauri::State<AppState>,
    password: Option<&str>,
) -> Result<(), String> {
    for entry in walkdir::WalkDir::new(dir_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        // Check for pause/cancel before each file
        check_and_wait_for_pause(job_id, state)?;
        
        let path = entry.path();
        
        if path.is_file() {
            *current_count += 1;
            let elapsed = start_time.elapsed().as_secs();
            emit_progress(app, job_id, "Compressing", *current_count, total_files, 
                         &path.to_string_lossy(), elapsed, state);
            add_file_to_zip(zip, path, store_paths, _output_zip, password)?;
        }
    }

    Ok(())
}

fn add_file_to_zip(
    zip: &mut zip::ZipWriter<fs::File>,
    file_path: &Path,
    store_paths: bool,
    _output_zip: &str,
    password: Option<&str>,
) -> Result<(), String> {
    let file_name = if store_paths {
        file_path.to_string_lossy().to_string().replace("\\", "/")
    } else {
        file_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    };

    let options = FileOptions::default()
        .compression_method(CompressionMethod::Deflated);
    
    // Note: Password encryption will be handled at ZipWriter level if needed
    let _ = password; // Store password parameter for future use
    
    zip.start_file(&file_name, options)
        .map_err(|e| format!("Failed to start file in zip: {}", e))?;

    let file_content = fs::read(file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path.display(), e))?;

    zip.write_all(&file_content)
        .map_err(|e| format!("Failed to write to zip: {}", e))?;

    Ok(())
}

fn add_dir_to_zip(
    zip: &mut zip::ZipWriter<fs::File>,
    dir_path: &Path,
    store_paths: bool,
    _output_zip: &str,
) -> Result<(), String> {
    for entry in walkdir::WalkDir::new(dir_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        
        if path.is_file() {
            let file_name = if store_paths {
                path.to_string_lossy().to_string().replace("\\", "/")
            } else {
                path.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            };

            let options = FileOptions::default()
                .compression_method(CompressionMethod::Deflated);
            zip.start_file(&file_name, options)
                .map_err(|e| format!("Failed to start file in zip: {}", e))?;

            let file_content = fs::read(path)
                .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

            zip.write_all(&file_content)
                .map_err(|e| format!("Failed to write to zip: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn start_extract(
    req: ExtractRequest,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let start_time = Instant::now();
    
    // Register job in queue
    {
        let mut jobs = state.jobs.lock().unwrap();
        jobs.insert(req.job_id.clone(), JobInfo {
            id: req.job_id.clone(),
            job_type: "extract".to_string(),
            status: JobStatus::Running,
            progress: 0,
            total: 0,
            current_file: String::new(),
            error: None,
        });
    }

    // Validate paths
    if !Path::new(&req.zip_path).exists() {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&req.job_id) {
            job.status = JobStatus::Failed;
            job.error = Some(format!("Zip file not found: {}", req.zip_path));
        }
        return Err(format!("Zip file not found: {}", req.zip_path));
    }

    if req.output_dir.is_empty() {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&req.job_id) {
            job.status = JobStatus::Failed;
            job.error = Some("Output directory cannot be empty".to_string());
        }
        return Err("Output directory cannot be empty".to_string());
    }

    // Open zip to count files
    let file_for_count = fs::File::open(&req.zip_path)
        .map_err(|e| {
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&req.job_id) {
                job.status = JobStatus::Failed;
                job.error = Some(format!("Failed to open zip file: {}", e));
            }
            format!("Failed to open zip file: {}", e)
        })?;

    let archive_count = zip::ZipArchive::new(file_for_count)
        .map_err(|e| {
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&req.job_id) {
                job.status = JobStatus::Failed;
                job.error = Some(format!("Failed to read zip archive: {}", e));
            }
            format!("Failed to read zip archive: {}", e)
        })?;

    let total_files = archive_count.len() as u32;

    // Update total in job info
    {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&req.job_id) {
            job.total = total_files;
        }
    }

    // Create output directory
    fs::create_dir_all(&req.output_dir)
        .map_err(|e| {
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&req.job_id) {
                job.status = JobStatus::Failed;
                job.error = Some(format!("Failed to create output directory: {}", e));
            }
            format!("Failed to create output directory: {}", e)
        })?;

    // Extract zip
    let file = fs::File::open(&req.zip_path)
        .map_err(|e| {
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&req.job_id) {
                job.status = JobStatus::Failed;
                job.error = Some(format!("Failed to open zip file: {}", e));
            }
            format!("Failed to open zip file: {}", e)
        })?;

    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| {
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&req.job_id) {
                job.status = JobStatus::Failed;
                job.error = Some(format!("Failed to read zip archive: {}", e));
            }
            format!("Failed to read zip archive: {}", e)
        })?;

    let _current_file = 0;

    for i in 0..archive.len() {
        // Check for pause/cancel
        check_and_wait_for_pause(&req.job_id, &state)?;

        let current_file = (i + 1) as u32;
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read zip entry: {}", e))?;

        // Get filename and normalize path separators
        let name = file.name()
            .trim_start_matches('/')
            .replace('/', "\\");

        // Skip if it's an empty name or directory
        if name.is_empty() || name.ends_with("\\") {
            continue;
        }

        let elapsed = start_time.elapsed().as_secs();
        emit_progress(&app, &req.job_id, "Extracting", current_file, total_files, 
                     &name, elapsed, &state);

        let output_path = Path::new(&req.output_dir).join(&name);

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        let mut outfile = fs::File::create(&output_path)
            .map_err(|e| format!("Failed to create output file at {}: {}", output_path.display(), e))?;

        std::io::copy(&mut file, &mut outfile)
            .map_err(|e| format!("Failed to extract file: {}", e))?;
    }

    // Final progress update
    let elapsed = start_time.elapsed().as_secs();
    emit_progress(&app, &req.job_id, "Extracting", total_files, total_files, 
                 "Done", elapsed, &state);

    // Mark job as completed
    {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&req.job_id) {
            job.status = JobStatus::Completed;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn cancel_job(job_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut jobs = state.jobs.lock().unwrap();
    if let Some(job) = jobs.get_mut(&job_id) {
        job.status = JobStatus::Cancelled;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_jobs(state: State<'_, AppState>) -> Result<Vec<JobInfo>, String> {
    let jobs = state.jobs.lock().unwrap();
    Ok(jobs.values().cloned().collect())
}

#[tauri::command]
pub async fn list_zip(zip_path: String) -> Result<Vec<String>, String> {
    let file = fs::File::open(&zip_path)
        .map_err(|e| format!("Failed to open zip file: {}", e))?;

    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Failed to read zip archive: {}", e))?;

    let mut files = Vec::new();
    for i in 0..archive.len() {
        let file = archive.by_index(i)
            .map_err(|e| format!("Failed to read zip entry: {}", e))?;
        files.push(file.name().to_string());
    }

    Ok(files)
}

#[tauri::command]
pub async fn check_file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub async fn check_dir_has_files(path: String) -> Result<bool, String> {
    if !Path::new(&path).exists() {
        return Ok(false);
    }

    match std::fs::read_dir(&path) {
        Ok(entries) => {
            Ok(entries.count() > 0)
        }
        Err(_) => Ok(false)
    }
}

#[tauri::command]
pub async fn pause_job(job_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut jobs = state.jobs.lock().unwrap();
    if let Some(job) = jobs.get_mut(&job_id) {
        if job.status == JobStatus::Running {
            job.status = JobStatus::Paused;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn resume_job(job_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut jobs = state.jobs.lock().unwrap();
    if let Some(job) = jobs.get_mut(&job_id) {
        if job.status == JobStatus::Paused {
            job.status = JobStatus::Running;
        }
    }
    Ok(())
}