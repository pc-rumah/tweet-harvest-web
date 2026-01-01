import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Typography,
    Button,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
    alpha,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

export default function SettingsPage() {
    const [authToken, setAuthToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('twitterAuthToken');
        if (saved) {
            setAuthToken(saved);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('twitterAuthToken', authToken);
        setSuccess('Auth token saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleClear = () => {
        localStorage.removeItem('twitterAuthToken');
        setAuthToken('');
        setSuccess('Auth token cleared');
        setTimeout(() => setSuccess(null), 3000);
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your Twitter auth token and preferences.
            </Typography>

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Auth Token Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Twitter Auth Token
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Your auth token is stored locally in your browser and is only used to authenticate
                        your Twitter search requests.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Auth Token"
                        type={showToken ? 'text' : 'password'}
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                                        {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={!authToken}
                        >
                            Save Token
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleClear}
                            disabled={!authToken}
                        >
                            Clear Token
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* How to Get Token */}
            <Card
                sx={{
                    background: (theme) =>
                        `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(
                            theme.palette.info.main,
                            0.05
                        )} 100%)`,
                    border: '1px solid',
                    borderColor: 'info.main',
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <InfoIcon color="info" />
                        <Typography variant="h6">How to Get Your Auth Token</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Follow these steps to get your Twitter auth token:
                    </Typography>
                    <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
                        <li>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Log in to Twitter/X in your browser
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Open Developer Tools (Press F12 or right-click → Inspect)
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Go to the <strong>Application</strong> tab (Chrome) or <strong>Storage</strong> tab (Firefox)
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Expand <strong>Cookies</strong> and select <strong>https://x.com</strong>
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                Find the cookie named <strong>auth_token</strong> and copy its value
                            </Typography>
                        </li>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Alert severity="warning" sx={{ backgroundColor: 'transparent', p: 0 }}>
                        <Typography variant="body2">
                            <strong>Important:</strong> Never share your auth token with anyone. It provides
                            full access to your Twitter account.
                        </Typography>
                    </Alert>
                </CardContent>
            </Card>
        </Box>
    );
}
