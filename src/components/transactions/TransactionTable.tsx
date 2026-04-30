import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, InputAdornment, Box, Chip, Typography, IconButton,
  TableSortLabel, Skeleton, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Transaction, SortField } from '../../types';
import type { SortConfig } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/calculations';

const FACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Miliz: 'error',
  KGG: 'primary',
  GOF: 'success',
  Enklave: 'warning',
};

interface Props {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  search: string;
  sort: SortConfig;
  onSearchChange: (v: string) => void;
  onSortChange: (field: SortField) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({
  transactions, loading, error, search, sort,
  onSearchChange, onSortChange, onDelete,
}: Props) {
  const columns: { field: SortField; label: string }[] = [
    { field: 'time', label: 'Time' },
    { field: 'name', label: 'Name' },
    { field: 'faction', label: 'Faction' },
    { field: 'amount', label: 'Amount' },
  ];

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          placeholder="Search by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
      </Box>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(({ field, label }) => (
                <TableCell key={field}>
                  <TableSortLabel
                    active={sort.field === field}
                    direction={sort.field === field ? sort.direction : 'asc'}
                    onClick={() => onSortChange(field)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
              : transactions.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: 'text.secondary' }}>No transactions found</Typography>
                    </TableCell>
                  </TableRow>
                )
                : transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{formatDateTime(tx.time)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{tx.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.faction}
                        color={FACTION_COLORS[tx.faction]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => onDelete(tx.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
