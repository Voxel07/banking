import { useState } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline,
  Container, Box, Tabs, Tab, Alert,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import Navbar from './components/layout/Navbar';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { TransactionProvider } from './hooks/TransactionProvider';
import { useTransactionContext } from './hooks/transactionContext';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import FactionsPage from './pages/FactionsPage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#0a0e1a', paper: '#111827' },
  },
  shape: { borderRadius: 10 },
});

function AppContent() {
  const [tab, setTab] = useState(0);
  const { online } = useTransactionContext();

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
          <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Transactions" />
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Analytics" />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Users" />
            <Tab icon={<ShieldIcon />} iconPosition="start" label="Factions" />
          </Tabs>
        </Container>
      </Box>
      <Container maxWidth="xl">
        <ErrorBoundary>
          {tab === 0 && <TransactionsPage />}
          {tab === 1 && <AnalyticsPage />}
          {tab === 2 && <UsersPage />}
          {tab === 3 && <FactionsPage />}
        </ErrorBoundary>
      </Container>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
