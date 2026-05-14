import { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import TopNameCards from '../components/analytics/TopNameCards';
import TransactionChart from '../components/analytics/TransactionChart';
import FactionChart from '../components/analytics/FactionChart';
import { useTransactionContext } from '../hooks/transactionContext';
import { useEventContext } from '../hooks/eventContext';
import {
  aggregateByName,
  buildTimeSeriesData,
  buildFactionTimeSeriesData,
} from '../utils/calculations';

export default function AnalyticsPage() {
  const { transactions, factionConfigs, names } = useTransactionContext();
  const { activeEvent } = useEventContext();

  // Derive faction list from active event or fallback to all unique from names
  const factions = useMemo<string[]>(() => {
    if (activeEvent?.factions && activeEvent.factions.length > 0) {
      return activeEvent.factions;
    }
    return [...new Set(names.map(n => n.faction).filter(Boolean))].sort();
  }, [activeEvent, names]);

  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const top5 = useMemo(() => nameSummaries.slice(0, 5), [nameSummaries]);
  const chartData = useMemo(() => buildTimeSeriesData(transactions), [transactions]);
  const factionChartData = useMemo(
    () => buildFactionTimeSeriesData(transactions, factionConfigs, factions),
    [transactions, factionConfigs, factions],
  );
  const top5Names = useMemo(() => top5.map((s) => s.name), [top5]);

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Analytics</Typography>

        <TopNameCards topNames={top5} />

        <TransactionChart data={chartData} names={top5Names} />

        <FactionChart data={factionChartData} />
      </Stack>
    </Box>
  );
}
