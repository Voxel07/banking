import { useState, useMemo } from 'react';
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
import ConfirmDialog from '../layout/ConfirmDialog';

const FACTION_CHIP_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Miliz: 'primary',
  KGG: 'error',
  GOF: 'warning',
  Enklave: 'info',
  'Militär': 'primary',
  'Freiheit': 'success',
  'Banditen': 'error',
  'Wissenschaftler': 'secondary',
  'Stalker': 'warning',
  'Söldner': 'info',
};

function getFactionColor(faction: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  return FACTION_CHIP_COLORS[faction] ?? 'default';
}

interface Props {
  transactions: ResolvedTransaction[];
  allTransactions?: ResolvedTransaction[]; // all transactions for balance guard
  loading: boolean;
  error: string | null;
  search: string;
  sort: SortConfig;
  onSearchChange: (v: string) => void;
  onSortChange: (field: SortField) => void;
  onDelete: (id: string) => Promise<void> | void;
  onEdit?: (id: string, data: { amount: number; tracked: boolean }) => void;
}

export default function TransactionTable({
  transactions, allTransactions, loading, error, search, sort,
  onSearchChange, onSortChange, onDelete, onEdit,
}: Props) {
  const [editTx, setEditTx] = useState<ResolvedTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTracked, setEditTracked] = useState(true);

  const [deleteTx, setDeleteTx] = useState<ResolvedTransaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // For the balance guard: compute the player's balance excluding the current tx
  const balanceWithoutTx = useMemo(() => {
    if (!editTx) return 0;
    const source = allTransactions ?? transactions;
    return source
      .filter(t => t.tracked && t.nameId === editTx.nameId)
      .reduce((sum, t) => sum + t.amount, 0) - editTx.amount;
  }, [editTx, allTransactions, transactions]);

  // Minimum allowed amount: balanceWithoutTx + newAmount >= 0  =>  newAmount >= -balanceWithoutTx
  const minAllowedAmount = -balanceWithoutTx;
  const editAmountNum = parseFloat(editAmount);
  const editAmountInvalid = !isNaN(editAmountNum) && editAmountNum < minAllowedAmount;

  const openEdit = (tx: ResolvedTransaction) => {
    setEditTx(tx);
    setEditAmount(tx.amount.toString());
    setEditTracked(tx.tracked);
  };

  const handleSaveEdit = () => {
    if (!editTx || !onEdit) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt)) return;
    if (amt < minAllowedAmount) return; // guard
    onEdit(editTx.id, { amount: amt, tracked: editTracked });
    setEditTx(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTx) return;
    setDeleteLoading(true);
    try {
      await onDelete(deleteTx.id);
    } finally {
      setDeleteLoading(false);
      setDeleteTx(null);
    }
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
                          color={getFactionColor(tx.faction)}
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
                          <IconButton size="small" onClick={() => setDeleteTx(tx)} color="error">
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
            <TextField
              label="Amount"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              fullWidth
              size="small"
              error={editAmountInvalid}
              helperText={
                editAmountInvalid
                  ? `Minimum allowed: ${formatCurrency(minAllowedAmount)} (balance would go below €0)`
                  : `Balance without this transaction: ${formatCurrency(balanceWithoutTx)}`
              }
              slotProps={{ htmlInput: { min: minAllowedAmount } }}
            />
            <FormControlLabel
              control={<Switch checked={editTracked} onChange={(e) => setEditTracked(e.target.checked)} />}
              label="Tracked (visible in rankings)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTx(null)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editAmountInvalid || isNaN(parseFloat(editAmount))}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTx}
        title="Delete Transaction"
        message={
          deleteTx
            ? `Delete transaction of ${formatCurrency(deleteTx.amount)} for ${deleteTx.name}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        severity="error"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTx(null)}
      />
    </Paper>
  );
}
