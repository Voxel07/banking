import { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import TopNameCards from '../components/analytics/TopNameCards';
import TransactionChart from '../components/analytics/TransactionChart';
import FactionChart from '../components/analytics/FactionChart';
import FactionCards from '../components/analytics/FactionCards';
import { useTransactionContext } from '../hooks/transactionContext';
import {
  aggregateByName,
  aggregateByFaction,
  buildTimeSeriesData,
  buildFactionTimeSeriesData,
} from '../utils/calculations';

export default function AnalyticsPage() {
  const { transactions, factionConfigs } = useTransactionContext();

  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const factionSummaries = useMemo(() => aggregateByFaction(transactions, factionConfigs), [transactions, factionConfigs]);
  const top5 = useMemo(() => nameSummaries.slice(0, 5), [nameSummaries]);
  const chartData = useMemo(() => buildTimeSeriesData(transactions), [transactions]);
  const factionChartData = useMemo(() => buildFactionTimeSeriesData(transactions, factionConfigs), [transactions, factionConfigs]);
  const top5Names = useMemo(() => top5.map((s) => s.name), [top5]);

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Analytics</Typography>

        <TopNameCards topNames={top5} />

        <FactionCards summaries={factionSummaries} />

        <TransactionChart data={chartData} names={top5Names} />

        <FactionChart data={factionChartData} />
      </Stack>
    </Box>
  );
}
