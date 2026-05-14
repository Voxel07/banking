import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import TransactionTable from './TransactionTable';
import { useTransactionFilters } from '../../hooks/useFilters';
import type { NameSummary } from '../../types';
import { useTransactionContext } from '../../hooks/transactionContext';

interface Props {
  summary: NameSummary | null;
  onClose: () => void;
}

export default function UserTransactionsModal({ summary, onClose }: Props) {
  const { deleteTransaction, updateTransaction } = useTransactionContext();
  const txList = summary ? summary.transactions : [];
  const { search, setSearch, sort, toggleSort, filtered } = useTransactionFilters(txList);

  return (
    <Dialog open={!!summary} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{summary?.name}'s Transactions</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          <TransactionTable
            transactions={filtered}
            loading={false}
            error={null}
            search={search}
            sort={sort}
            onSearchChange={setSearch}
            onSortChange={toggleSort}
            onDelete={deleteTransaction}
            onEdit={updateTransaction}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
