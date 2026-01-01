import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
    Description as FileIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    OpenInNew as OpenIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { API_BASE } from '../api';

interface DataFile {
    filename: string;
    size: number;
    createdAt: string;
    modifiedAt: string;
}

interface Tweet {
    id_str: string;
    full_text: string;
    username: string;
    created_at: string;
    retweet_count: number;
    favorite_count: number;
    reply_count: number;
    tweet_url: string;
    [key: string]: any;
}

export default function ResultsPage() {
    const [searchParams] = useSearchParams();
    const [files, setFiles] = useState<DataFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTweets, setLoadingTweets] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/data/list`);
            const data = await res.json();
            setFiles(data);

            // Auto-select file from URL or first file
            const fileParam = searchParams.get('file');
            if (fileParam && data.find((f: DataFile) => f.filename === fileParam)) {
                setSelectedFile(fileParam);
            } else if (data.length > 0 && !selectedFile) {
                setSelectedFile(data[0].filename);
            }
        } catch (err) {
            setError('Failed to load files');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (selectedFile) {
            loadTweets(selectedFile);
        }
    }, [selectedFile]);

    const loadTweets = async (filename: string) => {
        setLoadingTweets(true);
        try {
            const res = await fetch(`${API_BASE}/api/data/${filename}`);
            const data = await res.json();
            setTweets(data);
        } catch (err) {
            setError('Failed to load tweets');
        }
        setLoadingTweets(false);
    };

    const handleDownload = (filename: string) => {
        window.open(`${API_BASE}/api/data/download/${filename}`, '_blank');
    };

    const handleDelete = async (filename: string) => {
        try {
            await fetch(`${API_BASE}/api/data/${filename}`, { method: 'DELETE' });
            setDeleteDialog(null);
            if (selectedFile === filename) {
                setSelectedFile(null);
                setTweets([]);
            }
            loadFiles();
        } catch (err) {
            setError('Failed to delete file');
        }
    };

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const columns: GridColDef[] = [
        {
            field: 'username',
            headerName: 'User',
            width: 130,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    @{params.value}
                </Typography>
            ),
        },
        {
            field: 'full_text',
            headerName: 'Tweet',
            flex: 1,
            minWidth: 300,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 150,
            valueFormatter: (value) => formatDate(value),
        },
        {
            field: 'retweet_count',
            headerName: 'RTs',
            width: 80,
            type: 'number',
        },
        {
            field: 'favorite_count',
            headerName: 'Likes',
            width: 80,
            type: 'number',
        },
        {
            field: 'reply_count',
            headerName: 'Replies',
            width: 80,
            type: 'number',
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    size="small"
                    onClick={() => window.open(params.row.tweet_url, '_blank')}
                >
                    <OpenIcon fontSize="small" />
                </IconButton>
            ),
        },
    ];

    return (
        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 140px)' }}>
            {/* File List Sidebar */}
            <Card sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Data Files</Typography>
                        <IconButton size="small" onClick={loadFiles}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </CardContent>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {loading ? (
                        <Box sx={{ p: 2 }}>
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                            ))}
                        </Box>
                    ) : files.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">No data files found</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {files.map((file) => (
                                <ListItemButton
                                    key={file.filename}
                                    selected={selectedFile === file.filename}
                                    onClick={() => setSelectedFile(file.filename)}
                                >
                                    <ListItemIcon>
                                        <FileIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {file.filename}
                                            </Typography>
                                        }
                                        secondary={formatBytes(file.size)}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleDownload(file.filename); }}
                                        >
                                            <DownloadIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog(file.filename); }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Box>
            </Card>

            {/* Data Grid */}
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6">
                                {selectedFile || 'Select a file'}
                            </Typography>
                            {selectedFile && (
                                <Chip
                                    size="small"
                                    label={`${tweets.length} tweets`}
                                    sx={{ mt: 0.5 }}
                                />
                            )}
                        </Box>
                        {selectedFile && (
                            <Button
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownload(selectedFile)}
                            >
                                Download
                            </Button>
                        )}
                    </Box>
                </CardContent>
                <Box sx={{ flex: 1, px: 2, pb: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    <DataGrid
                        rows={tweets}
                        columns={columns}
                        loading={loadingTweets}
                        getRowId={(row) => row.id_str || Math.random().toString()}
                        pageSizeOptions={[25, 50, 100]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                            },
                        }}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
                <DialogTitle>Delete File?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{deleteDialog}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={() => deleteDialog && handleDelete(deleteDialog)}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
