import { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import pb from '../../services/pocketbase';

export default function Navbar() {
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await pb.health.check({});
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };

    checkHealth();
    intervalRef.current = setInterval(checkHealth, 10_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <AccountBalanceIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Banking Dashboard
        </Typography>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: connected ? 'success.main' : 'error.main',
            boxShadow: connected
              ? '0 0 6px 2px rgba(76,175,80,0.6)'
              : '0 0 6px 2px rgba(244,67,54,0.6)',
          }}
          title={connected ? 'Live' : 'Disconnected'}
        />
        <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
          {connected ? 'Live' : 'Offline'}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
