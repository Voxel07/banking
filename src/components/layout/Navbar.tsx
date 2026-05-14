import { useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, TextField, MenuItem, Button, IconButton, Tooltip, Stack } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslation } from 'react-i18next';
import pb from '../../services/pocketbase';
import { useEventContext } from '../../hooks/eventContext';
import { useAuthContext } from '../../hooks/authContext';
import { useColorMode } from '../../hooks/ColorModeProvider';

export default function Navbar() {
  const { events, activeEvent, setActiveEventId } = useEventContext();
  const { user, logout } = useAuthContext();
  const { mode, toggleColorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'de' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('i18nextLng', nextLang);
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await pb.health.check({});
      } catch {
        // ignore
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
          {t('app.title')}
        </Typography>
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
          {events.length > 0 && (
            <TextField
              select
              size="small"
              value={activeEvent?.id || ''}
              onChange={(e) => setActiveEventId(e.target.value === '' ? null : e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">
                <em>All Events (Global)</em>
              </MenuItem>
              {events.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  {ev.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle Language">
              <IconButton color="inherit" onClick={toggleLanguage}>
                <TranslateIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {user && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', borderLeft: 1, borderColor: 'divider', pl: 3 }}>
              <Typography variant="body2">
                {user.name} ({user.role})
              </Typography>
              <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout}>
                {t('nav.logout')}
              </Button>
            </Stack>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
