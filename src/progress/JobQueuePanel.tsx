import { useEffect, useState } from 'react';
import type { JobInfo } from '../shared/services/zip.service';
import { ZipService, JobStatus } from '../shared/services/zip.service';
import { Button } from '../shared/components/Button';
import '../progress/JobQueue.css';

interface JobQueuePanelProps {
  onJobsChange?: (jobs: JobInfo[]) => void;
}

const JobQueuePanel = ({ onJobsChange }: JobQueuePanelProps) => {
  const [jobs, setJobs] = useState<JobInfo[]>([]);

  useEffect(() => {
    // Poll for job updates every 500ms
    const interval = setInterval(async () => {
      try {
        const currentJobs = await ZipService.getJobs();
        setJobs(currentJobs);
        onJobsChange?.(currentJobs);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onJobsChange]);

  const handleCancel = async (jobId: string) => {
    try {
      await ZipService.cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handlePause = async (jobId: string) => {
    try {
      await ZipService.pauseJob(jobId);
    } catch (error) {
      console.error('Failed to pause job:', error);
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await ZipService.resumeJob(jobId);
    } catch (error) {
      console.error('Failed to resume job:', error);
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="job-queue-panel">
      <h3>Active Jobs ({jobs.length})</h3>
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className={`job-item job-status-${job.status.toLowerCase()}`}>
            <div className="job-header">
              <span className="job-type">{job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}</span>
              <span className={`job-status-badge status-${job.status.toLowerCase()}`}>
                {job.status}
              </span>
              <div className="job-actions">
                {job.status === JobStatus.Running && (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={() => handlePause(job.id)}
                    >
                      ⏸ Pause
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleCancel(job.id)}
                    >
                      ✕ Cancel
                    </Button>
                  </>
                )}
                {job.status === 'Paused' && (
                  <>
                    <Button 
                      variant="primary"
                      onClick={() => handleResume(job.id)}
                    >
                      ▶ Resume
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleCancel(job.id)}
                    >
                      ✕ Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {(job.status === JobStatus.Running || job.status === JobStatus.Completed) && (
              <>
                <div className="job-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${job.total > 0 ? (job.progress / job.total * 100) : 0}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {job.progress}/{job.total} files
                  </span>
                </div>

                {job.current_file && (
                  <div className="current-file" title={job.current_file}>
                    {job.current_file}
                  </div>
                )}
              </>
            )}

            {job.status === JobStatus.Failed && job.error && (
              <div className="job-error">
                {job.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobQueuePanel;
