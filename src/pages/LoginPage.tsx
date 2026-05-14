import { Container, Typography, Button, Paper } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useAuthContext } from '../hooks/authContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { loginOAuth } = useAuthContext();
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {t('login.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          {t('login.desc')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={loginOAuth}
          fullWidth
        >
          {t('login.button')}
        </Button>
      </Paper>
    </Container>
  );
}
