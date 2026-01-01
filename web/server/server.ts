import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jobManager, CrawlJobParams } from './job-manager.js';
// @ts-ignore
import crawlLib from '../../src/crawl.js';
const { crawl } = crawlLib;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TWEETS_DATA_DIR = path.resolve(__dirname, '../../tweets-data');

const app = express();
app.use(cors());
app.use(express.json());

// SSE clients for real-time updates
const sseClients: Map<string, express.Response> = new Map();

// Start a new crawl job
app.post('/api/crawl/start', async (req, res) => {
    const params: CrawlJobParams = req.body;

    if (!params.accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
    }

    if (!params.keywords && !params.threadUrl) {
        return res.status(400).json({ error: 'Keywords or thread URL is required' });
    }

    const job = jobManager.createJob(params);
    jobManager.updateJob(job.id, { status: 'running' });

    // Start crawl in background
    (async () => {
        try {
            await crawl({
                ACCESS_TOKEN: params.accessToken,
                SEARCH_KEYWORDS: params.keywords,
                TWEET_THREAD_URL: params.threadUrl,
                SEARCH_FROM_DATE: params.fromDate,
                SEARCH_TO_DATE: params.toDate,
                TARGET_TWEET_COUNT: params.targetCount || 10,
                DELAY_EACH_TWEET_SECONDS: params.delayEachTweet || 3,
                DELAY_EVERY_100_TWEETS_SECONDS: params.delayEvery100 || 10,
                SEARCH_TAB: params.searchTab || 'TOP',
                EXPORT_FORMAT: params.exportFormat || 'csv',
            });

            jobManager.updateJob(job.id, {
                status: 'completed',
                progress: 100,
                completedAt: new Date(),
            });
        } catch (error: any) {
            jobManager.updateJob(job.id, {
                status: 'error',
                error: error.message || 'Unknown error',
                completedAt: new Date(),
            });
        }
    })();

    res.json(job);
});

// Get job status
app.get('/api/crawl/status/:id', (req, res) => {
    const job = jobManager.getJob(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
});

// Get all jobs
app.get('/api/crawl/jobs', (req, res) => {
    res.json(jobManager.getAllJobs());
});

// SSE endpoint for real-time job updates
app.get('/api/crawl/events/:id', (req, res) => {
    const jobId = req.params.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.set(jobId, res);

    const sendUpdate = (job: any) => {
        if (job.id === jobId) {
            res.write(`data: ${JSON.stringify(job)}\n\n`);
        }
    };

    jobManager.on('jobUpdate', sendUpdate);

    req.on('close', () => {
        sseClients.delete(jobId);
        jobManager.off('jobUpdate', sendUpdate);
    });
});

// List all data files
app.get('/api/data/list', (req, res) => {
    try {
        if (!fs.existsSync(TWEETS_DATA_DIR)) {
            return res.json([]);
        }

        const files = fs.readdirSync(TWEETS_DATA_DIR)
            .filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'))
            .map(filename => {
                const filePath = path.join(TWEETS_DATA_DIR, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                };
            })
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

        res.json(files);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get file content as JSON
app.get('/api/data/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(TWEETS_DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        if (filename.endsWith('.csv')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            res.json(parsed.data);
        } else if (filename.endsWith('.xlsx')) {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            res.json(data);
        } else {
            res.status(400).json({ error: 'Unsupported file format' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Download file
app.get('/api/data/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(TWEETS_DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
});

// Delete file
app.delete('/api/data/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(TWEETS_DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Tweet Harvest API Server running on http://localhost:${PORT}`);
});
