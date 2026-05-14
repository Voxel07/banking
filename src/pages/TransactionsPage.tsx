import { Box, Typography, Stack } from '@mui/material';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionTable from '../components/transactions/TransactionTable';
import { useTransactionContext } from '../hooks/transactionContext';
import { useTransactionFilters } from '../hooks/useFilters';

export default function TransactionsPage() {
  const { transactions, loading, error, createTransaction, updateTransaction, deleteTransaction, names } =
    useTransactionContext();
  const { search, setSearch, sort, toggleSort, filtered } = useTransactionFilters(transactions);

  const handleSubmit = async (data: Parameters<typeof createTransaction>[0]) => {
    await createTransaction(data);
  };

  const handleEdit = async (id: string, data: { amount: number; tracked: boolean }) => {
    await updateTransaction(id, data);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Transactions</Typography>

        <TransactionForm
          names={names}
          onSubmit={handleSubmit}
        />

        <TransactionTable
          transactions={filtered}
          allTransactions={transactions}
          loading={loading}
          error={error}
          search={search}
          sort={sort}
          onSearchChange={setSearch}
          onSortChange={toggleSort}
          onDelete={deleteTransaction}
          onEdit={handleEdit}
        />
      </Stack>
    </Box>
  );
}
