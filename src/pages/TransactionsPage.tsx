import { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionTable from '../components/transactions/TransactionTable';
import NameTotalsTable from '../components/transactions/NameTotalsTable';
import FactionCards from '../components/analytics/FactionCards';
import { useTransactionContext } from '../hooks/transactionContext';
import { useTransactionFilters } from '../hooks/useFilters';
import { aggregateByName, aggregateByFaction } from '../utils/calculations';

export default function TransactionsPage() {
  const { transactions, loading, error, createTransaction, deleteTransaction, names, ensureName } =
    useTransactionContext();
  const { search, setSearch, sort, toggleSort, filtered } = useTransactionFilters(transactions);

  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const factionSummaries = useMemo(() => aggregateByFaction(transactions), [transactions]);

  const handleSubmit = async (data: Parameters<typeof createTransaction>[0]) => {
    await ensureName(data.name, data.faction);
    await createTransaction(data);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Transactions</Typography>

        <FactionCards summaries={factionSummaries} />

        <TransactionForm
          names={names}
          transactions={transactions}
          onSubmit={handleSubmit}
        />

        <TransactionTable
          transactions={filtered}
          loading={loading}
          error={error}
          search={search}
          sort={sort}
          onSearchChange={setSearch}
          onSortChange={toggleSort}
          onDelete={deleteTransaction}
        />

        <NameTotalsTable summaries={nameSummaries} />
      </Stack>
    </Box>
  );
}
