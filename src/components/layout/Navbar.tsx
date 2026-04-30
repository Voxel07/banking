import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export default function Navbar() {
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
            bgcolor: 'success.main',
            boxShadow: '0 0 6px 2px rgba(76,175,80,0.6)',
          }}
          title="Live"
        />
        <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
          Live
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
