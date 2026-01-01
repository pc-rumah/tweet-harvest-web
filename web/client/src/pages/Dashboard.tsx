import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Skeleton,
    alpha,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Folder as FolderIcon,
    ArrowForward as ArrowIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { API_BASE } from '../api';

interface Job {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    keywords: string;
    tweetCount: number;
    createdAt: string;
}

interface DataFile {
    filename: string;
    size: number;
    modifiedAt: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [files, setFiles] = useState<DataFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/api/crawl/jobs`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/data/list`).then(r => r.json()).catch(() => []),
        ]).then(([jobsData, filesData]) => {
            setJobs(jobsData);
            setFiles(filesData);
            setLoading(false);
        });
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusChip = (status: Job['status']) => {
        const config = {
            pending: { color: 'warning' as const, icon: <ScheduleIcon fontSize="small" /> },
            running: { color: 'info' as const, icon: <PlayIcon fontSize="small" /> },
            completed: { color: 'success' as const, icon: <CheckIcon fontSize="small" /> },
            error: { color: 'error' as const, icon: <ErrorIcon fontSize="small" /> },
        };
        return (
            <Chip
                size="small"
                label={status}
                color={config[status].color}
                icon={config[status].icon}
                sx={{ textTransform: 'capitalize' }}
            />
        );
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome to Tweet Harvest
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Scrape tweets from Twitter search results with ease.
                </Typography>
            </Box>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                        sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: (theme) =>
                                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
                                    theme.palette.primary.main,
                                    0.05
                                )} 100%)`,
                            border: '1px solid',
                            borderColor: 'primary.main',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                            },
                        }}
                        onClick={() => navigate('/crawl')}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: 'primary.main',
                                    display: 'flex',
                                }}
                            >
                                <PlayIcon sx={{ color: 'white' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6">Start New Crawl</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Search and harvest tweets
                                </Typography>
                            </Box>
                            <ArrowIcon color="primary" />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                        sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                        }}
                        onClick={() => navigate('/results')}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: 'secondary.main',
                                    display: 'flex',
                                }}
                            >
                                <FolderIcon sx={{ color: 'white' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6">View Results</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {files.length} files collected
                                </Typography>
                            </Box>
                            <ArrowIcon color="action" />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Jobs & Files */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Recent Jobs</Typography>
                                <Button size="small" onClick={() => navigate('/crawl')}>
                                    View All
                                </Button>
                            </Box>
                            {loading ? (
                                <Box>
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                                    ))}
                                </Box>
                            ) : jobs.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No jobs yet. Start your first crawl!
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {jobs.slice(0, 5).map((job) => (
                                        <ListItem key={job.id} disableGutters>
                                            <ListItemText
                                                primary={job.keywords || 'Thread crawl'}
                                                secondary={formatDate(job.createdAt)}
                                            />
                                            <ListItemSecondaryAction>
                                                {statusChip(job.status)}
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Recent Files</Typography>
                                <Button size="small" onClick={() => navigate('/results')}>
                                    View All
                                </Button>
                            </Box>
                            {loading ? (
                                <Box>
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                                    ))}
                                </Box>
                            ) : files.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No data files yet.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {files.slice(0, 5).map((file) => (
                                        <ListItem key={file.filename} disableGutters>
                                            <ListItemText
                                                primary={file.filename}
                                                secondary={formatBytes(file.size)}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/results?file=${file.filename}`)}
                                                >
                                                    <ArrowIcon fontSize="small" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
