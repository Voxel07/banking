import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Alert, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import Navbar from './components/layout/Navbar';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { TransactionProvider } from './hooks/TransactionProvider';
import { useTransactionContext } from './hooks/transactionContext';
import { EventProvider } from './hooks/EventProvider';
import { AuthProvider } from './hooks/AuthProvider';
import { useAuthContext } from './hooks/authContext';
import { ColorModeProvider } from './hooks/ColorModeProvider';
import LoginPage from './pages/LoginPage';
import TransactionsPage from './pages/TransactionsPage';
import TransfersPage from './pages/TransfersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import FactionsPage from './pages/FactionsPage';
import LogsPage from './pages/LogsPage';
import EventsPage from './pages/EventsPage';

// Maps URL path → tab index for the MUI Tabs component
const TAB_PATHS = [
  '/transactions',
  '/transfers',
  '/analytics',
  '/users',
  '/factions',
  '/logs',
  '/events',
];

function AccessDenied() {
  return <Alert severity="error" sx={{ mt: 3 }}>Access Denied: Admins Only</Alert>;
}

/** Renders children only for admins, otherwise shows AccessDenied */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
  if (!isAdmin) return <AccessDenied />;
  return <>{children}</>;
}

function AuthenticatedMain() {
  const { online } = useTransactionContext();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve the current tab index from the pathname
  const currentTab = TAB_PATHS.findIndex((p) => location.pathname.startsWith(p));
  const tabValue = currentTab >= 0 ? currentTab : 0;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(TAB_PATHS[newValue]);
  };

  return (
    <>
      <Navbar />
      {!online && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          You are offline. Changes will sync when the connection is restored.
        </Alert>
      )}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab value={0} icon={<ReceiptLongIcon />} iconPosition="start" label={t('nav.transactions')} />
            <Tab value={1} icon={<SwapHorizIcon />} iconPosition="start" label={t('nav.transfers')} />
            <Tab value={2} icon={<BarChartIcon />} iconPosition="start" label={t('nav.analytics')} />
            <Tab value={3} icon={<PeopleIcon />} iconPosition="start" label={t('nav.users')} />
            {isAdmin && <Tab value={4} icon={<ShieldIcon />} iconPosition="start" label={t('nav.factions')} />}
            <Tab value={5} icon={<HistoryIcon />} iconPosition="start" label="Logs" />
            {isAdmin && <Tab value={6} icon={<EventIcon />} iconPosition="start" label="Events" />}
          </Tabs>
        </Container>
      </Box>
      <Container maxWidth="xl">
        <ErrorBoundary>
          <Routes>
            <Route index element={<Navigate to="/transactions" replace />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="factions" element={<RequireAdmin><FactionsPage /></RequireAdmin>} />
            <Route path="logs" element={<RequireAdmin><LogsPage /></RequireAdmin>} />
            <Route path="events" element={<RequireAdmin><EventsPage /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/transactions" replace />} />
          </Routes>
        </ErrorBoundary>
      </Container>
    </>
  );
}

function AppContent() {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    // Allow access to /login without redirect loop
    if (location.pathname === '/login') return <LoginPage />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <EventProvider>
      <TransactionProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/transactions" replace />} />
          <Route path="/*" element={<AuthenticatedMain />} />
        </Routes>
      </TransactionProvider>
    </EventProvider>
  );
}

export default function App() {
  return (
    <ColorModeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </ColorModeProvider>
  );
}
