import { useState, useMemo } from 'react';
import { Box, Typography, Stack, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTransactionContext } from '../hooks/transactionContext';
import NameTotalsTable from '../components/transactions/NameTotalsTable';
import UserTransactionsModal from '../components/transactions/UserTransactionsModal';
import type { NameSummary } from '../types';

export default function UsersPage() {
  const { names, transactions } = useTransactionContext();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<NameSummary | null>(null);

  const filteredNames = useMemo(() => {
    if (!search.trim()) return names;
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return names.filter((n) => {
      const combined = `${n.name} ${n.faction}`.toLowerCase();
      return terms.every((term) => combined.includes(term));
    });
  }, [names, search]);

  const userSummaries = useMemo<NameSummary[]>(() => {
    return filteredNames.map((user) => {
      const userTx = transactions.filter((tx) => tx.name === user.name);
      const total = userTx.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        name: user.name,
        faction: user.faction,
        total: total,
        count: userTx.length,
        transactions: userTx,
      };
    });
  }, [filteredNames, transactions]);

  const searchInput = (
    <TextField
      placeholder="Search users…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Users</Typography>
        <NameTotalsTable 
          summaries={userSummaries} 
          title="All Users" 
          headerAction={searchInput}
          onRowClick={(s) => setSelectedUser(s)}
        />
        <UserTransactionsModal 
          summary={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      </Stack>
    </Box>
  );
}
