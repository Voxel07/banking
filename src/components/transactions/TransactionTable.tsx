import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, InputAdornment, Box, Chip, Typography, IconButton,
  TableSortLabel, Skeleton, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, FormControlLabel, Switch, Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { ResolvedTransaction, SortField, SortConfig } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/calculations';

const FACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Miliz: 'primary',
  KGG: 'error',
  GOF: 'warning',
  Enklave: 'info',
};

interface Props {
  transactions: ResolvedTransaction[];
  loading: boolean;
  error: string | null;
  search: string;
  sort: SortConfig;
  onSearchChange: (v: string) => void;
  onSortChange: (field: SortField) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, data: { amount: number; tracked: boolean }) => void;
}

export default function TransactionTable({
  transactions, loading, error, search, sort,
  onSearchChange, onSortChange, onDelete, onEdit,
}: Props) {
  const [editTx, setEditTx] = useState<ResolvedTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTracked, setEditTracked] = useState(true);

  const openEdit = (tx: ResolvedTransaction) => {
    setEditTx(tx);
    setEditAmount(tx.amount.toString());
    setEditTracked(tx.tracked);
  };

  const handleSaveEdit = () => {
    if (!editTx || !onEdit) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt)) return;
    onEdit(editTx.id, { amount: amt, tracked: editTracked });
    setEditTx(null);
  };

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
                <TableCell key={field} align={field === 'amount' ? 'right' : 'left'}>
                  <TableSortLabel
                    active={sort.field === field}
                    direction={sort.field === field ? sort.direction : 'asc'}
                    onClick={() => onSortChange(field)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
              : transactions.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: 'text.secondary' }}>No transactions found</Typography>
                    </TableCell>
                  </TableRow>
                )
                : transactions.map((tx) => {
                  const isDeposit = tx.amount > 0;
                  return (
                    <TableRow
                      key={tx.id}
                      hover
                      sx={{
                        borderLeft: 4,
                        borderColor: isDeposit ? 'success.main' : 'error.main',
                        opacity: tx.tracked ? 1 : 0.6,
                      }}
                    >
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
                        <Typography sx={{
                          fontWeight: 600,
                          color: isDeposit ? 'success.main' : 'error.main',
                        }}>
                          {isDeposit ? '+' : ''}{formatCurrency(tx.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {!tx.tracked && (
                          <Chip
                            icon={<VisibilityOffIcon />}
                            label="Untracked"
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          {onEdit && (
                            <IconButton size="small" onClick={() => openEdit(tx)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => onDelete(tx.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onClose={() => setEditTx(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {editTx?.name} ({editTx?.faction})
            </Typography>
            <TextField label="Amount" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} fullWidth size="small" />
            <FormControlLabel
              control={<Switch checked={editTracked} onChange={(e) => setEditTracked(e.target.checked)} />}
              label="Tracked (visible in rankings)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTx(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
