import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export interface CrawlJob {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    tweetCount: number;
    keywords: string;
    createdAt: Date;
    completedAt?: Date;
    error?: string;
    outputFile?: string;
}

export interface CrawlJobParams {
    accessToken: string;
    keywords?: string;
    threadUrl?: string;
    fromDate?: string;
    toDate?: string;
    targetCount: number;
    delayEachTweet?: number;
    delayEvery100?: number;
    searchTab?: 'LATEST' | 'TOP';
    exportFormat?: 'csv' | 'xlsx';
}

class JobManager extends EventEmitter {
    private jobs: Map<string, CrawlJob> = new Map();

    createJob(params: CrawlJobParams): CrawlJob {
        const job: CrawlJob = {
            id: uuidv4(),
            status: 'pending',
            progress: 0,
            tweetCount: 0,
            keywords: params.keywords || params.threadUrl || '',
            createdAt: new Date(),
        };
        this.jobs.set(job.id, job);
        return job;
    }

    getJob(id: string): CrawlJob | undefined {
        return this.jobs.get(id);
    }

    getAllJobs(): CrawlJob[] {
        return Array.from(this.jobs.values()).sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
    }

    updateJob(id: string, updates: Partial<CrawlJob>): CrawlJob | undefined {
        const job = this.jobs.get(id);
        if (job) {
            Object.assign(job, updates);
            this.emit('jobUpdate', job);
            return job;
        }
        return undefined;
    }

    deleteJob(id: string): boolean {
        return this.jobs.delete(id);
    }
}

export const jobManager = new JobManager();
