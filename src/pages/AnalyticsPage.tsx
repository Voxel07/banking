import { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import TopNameCards from '../components/analytics/TopNameCards';
import TransactionChart from '../components/analytics/TransactionChart';
import FactionCards from '../components/analytics/FactionCards';
import { useTransactionContext } from '../hooks/transactionContext';
import {
  aggregateByName,
  aggregateByFaction,
  buildTimeSeriesData,
} from '../utils/calculations';

export default function AnalyticsPage() {
  const { transactions } = useTransactionContext();

  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const factionSummaries = useMemo(() => aggregateByFaction(transactions), [transactions]);
  const top3 = useMemo(() => nameSummaries.slice(0, 3), [nameSummaries]);
  const chartData = useMemo(() => buildTimeSeriesData(transactions), [transactions]);
  const top3Names = useMemo(() => top3.map((s) => s.name), [top3]);

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Analytics</Typography>

        <TopNameCards top3={top3} />

        <TransactionChart data={chartData} names={top3Names} />

        <FactionCards summaries={factionSummaries} />
      </Stack>
    </Box>
  );
}
