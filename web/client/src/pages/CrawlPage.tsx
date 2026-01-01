import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Grid,
    Alert,
    LinearProgress,
    Chip,
    InputAdornment,
    IconButton,
    Collapse,
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { API_BASE } from '../api';

interface CrawlFormData {
    accessToken: string;
    keywords: string;
    threadUrl: string;
    fromDate: Dayjs | null;
    toDate: Dayjs | null;
    targetCount: number;
    delayEachTweet: number;
    delayEvery100: number;
    searchTab: 'TOP' | 'LATEST';
    exportFormat: 'csv' | 'xlsx';
}

export default function CrawlPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'search' | 'thread'>('search');
    const [showToken, setShowToken] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const [form, setForm] = useState<CrawlFormData>({
        accessToken: localStorage.getItem('twitterAuthToken') || '',
        keywords: '',
        threadUrl: '',
        fromDate: null,
        toDate: null,
        targetCount: 100,
        delayEachTweet: 3,
        delayEvery100: 10,
        searchTab: 'TOP',
        exportFormat: 'csv',
    });

    const handleInputChange = (field: keyof CrawlFormData, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!form.accessToken) {
            setError('Twitter auth token is required');
            setLoading(false);
            return;
        }

        if (mode === 'search' && !form.keywords) {
            setError('Search keywords are required');
            setLoading(false);
            return;
        }

        if (mode === 'thread' && !form.threadUrl) {
            setError('Thread URL is required');
            setLoading(false);
            return;
        }

        // Save token for future use
        localStorage.setItem('twitterAuthToken', form.accessToken);

        try {
            const response = await fetch(`${API_BASE}/api/crawl/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: form.accessToken,
                    keywords: mode === 'search' ? form.keywords : undefined,
                    threadUrl: mode === 'thread' ? form.threadUrl : undefined,
                    fromDate: form.fromDate?.format('DD-MM-YYYY'),
                    toDate: form.toDate?.format('DD-MM-YYYY'),
                    targetCount: form.targetCount,
                    delayEachTweet: form.delayEachTweet,
                    delayEvery100: form.delayEvery100,
                    searchTab: form.searchTab,
                    exportFormat: form.exportFormat,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start crawl');
            }

            setJobId(data.id);

            // Start SSE for real-time updates
            const eventSource = new EventSource(`${API_BASE}/api/crawl/events/${data.id}`);

            eventSource.onmessage = (event) => {
                const job = JSON.parse(event.data);
                setProgress(job.progress || 0);

                if (job.status === 'completed' || job.status === 'error') {
                    eventSource.close();
                    setLoading(false);

                    if (job.status === 'completed') {
                        navigate('/results');
                    } else if (job.status === 'error') {
                        setError(job.error || 'Crawl failed');
                    }
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                // Poll for status instead
                const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`${API_BASE}/api/crawl/status/${data.id}`);
                    const status = await statusRes.json();

                    if (status.status === 'completed' || status.status === 'error') {
                        clearInterval(pollInterval);
                        setLoading(false);

                        if (status.status === 'completed') {
                            navigate('/results');
                        } else {
                            setError(status.error || 'Crawl failed');
                        }
                    }
                }, 2000);
            };
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom>
                    New Crawl
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Configure your tweet crawl settings and start harvesting.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading && jobId && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Crawl in Progress...
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {progress > 0 ? `${progress}% complete` : 'Starting crawl...'}
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            {/* Mode Selection */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <Chip
                                    label="Search Keywords"
                                    onClick={() => setMode('search')}
                                    color={mode === 'search' ? 'primary' : 'default'}
                                    variant={mode === 'search' ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    label="Thread URL"
                                    onClick={() => setMode('thread')}
                                    color={mode === 'thread' ? 'primary' : 'default'}
                                    variant={mode === 'thread' ? 'filled' : 'outlined'}
                                />
                            </Box>

                            {/* Auth Token */}
                            <TextField
                                fullWidth
                                label="Twitter Auth Token"
                                type={showToken ? 'text' : 'password'}
                                value={form.accessToken}
                                onChange={(e) => handleInputChange('accessToken', e.target.value)}
                                sx={{ mb: 3 }}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                                                {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText="Get your auth_token from browser cookies after logging into Twitter"
                            />

                            {/* Keywords or Thread URL */}
                            {mode === 'search' ? (
                                <TextField
                                    fullWidth
                                    label="Search Keywords"
                                    value={form.keywords}
                                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                                    sx={{ mb: 3 }}
                                    required
                                    placeholder="e.g., #AI OR @elonmusk"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            ) : (
                                <TextField
                                    fullWidth
                                    label="Tweet Thread URL"
                                    value={form.threadUrl}
                                    onChange={(e) => handleInputChange('threadUrl', e.target.value)}
                                    sx={{ mb: 3 }}
                                    required
                                    placeholder="https://x.com/username/status/123456789"
                                />
                            )}

                            {/* Date Range */}
                            {mode === 'search' && (
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <DatePicker
                                            label="From Date"
                                            value={form.fromDate}
                                            onChange={(date) => handleInputChange('fromDate', date)}
                                            slotProps={{ textField: { fullWidth: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <DatePicker
                                            label="To Date"
                                            value={form.toDate}
                                            onChange={(date) => handleInputChange('toDate', date)}
                                            slotProps={{ textField: { fullWidth: true } }}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {/* Tweet Count */}
                            <Box sx={{ mb: 3 }}>
                                <Typography gutterBottom>
                                    Target Tweet Count: {form.targetCount}
                                </Typography>
                                <Slider
                                    value={form.targetCount}
                                    onChange={(_, value) => handleInputChange('targetCount', value)}
                                    min={10}
                                    max={1000}
                                    step={10}
                                    marks={[
                                        { value: 10, label: '10' },
                                        { value: 500, label: '500' },
                                        { value: 1000, label: '1000' },
                                    ]}
                                />
                            </Box>

                            {/* Search Tab & Export Format */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Search Tab</InputLabel>
                                        <Select
                                            value={form.searchTab}
                                            label="Search Tab"
                                            onChange={(e) => handleInputChange('searchTab', e.target.value)}
                                        >
                                            <MenuItem value="TOP">Top</MenuItem>
                                            <MenuItem value="LATEST">Latest</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Export Format</InputLabel>
                                        <Select
                                            value={form.exportFormat}
                                            label="Export Format"
                                            onChange={(e) => handleInputChange('exportFormat', e.target.value)}
                                        >
                                            <MenuItem value="csv">CSV</MenuItem>
                                            <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {/* Advanced Options */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    mb: showAdvanced ? 2 : 3,
                                }}
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <Typography variant="body2" color="primary">
                                    Advanced Options
                                </Typography>
                                {showAdvanced ? <CollapseIcon /> : <ExpandIcon />}
                            </Box>

                            <Collapse in={showAdvanced}>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Delay per Tweet (seconds)"
                                            value={form.delayEachTweet}
                                            onChange={(e) => handleInputChange('delayEachTweet', parseInt(e.target.value))}
                                            inputProps={{ min: 1, max: 30 }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Delay per 100 Tweets (seconds)"
                                            value={form.delayEvery100}
                                            onChange={(e) => handleInputChange('delayEvery100', parseInt(e.target.value))}
                                            inputProps={{ min: 0, max: 300 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Collapse>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? 'Crawling...' : 'Start Crawl'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
}
