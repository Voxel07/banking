import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Stack, Skeleton, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Switch, Alert,
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ResolvedTransfer, NameSummary } from '../../types';
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
  transfers: ResolvedTransfer[];
  loading?: boolean;
  /** Name summaries used to compute sender balance for the edit guard */
  nameSummaries?: NameSummary[];
  onEdit?: (id: string, data: { amount: number; tracked: boolean }) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function TransferTable({ transfers, loading, nameSummaries, onEdit, onDelete }: Props) {
  const [editTx, setEditTx] = useState<ResolvedTransfer | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTracked, setEditTracked] = useState(true);

  const [deleteTx, setDeleteTx] = useState<ResolvedTransfer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openEdit = (tx: ResolvedTransfer) => {
    setEditTx(tx);
    setEditAmount(tx.amount.toString());
    setEditTracked(tx.tracked);
  };

  // --- Balance guard for edit ---
  // Sender's current total balance from name summaries
  const senderCurrentBalance = nameSummaries?.find(s => s.name === editTx?.senderName)?.total ?? 0;
  // Balance as if this transfer never existed: add back the amount that was deducted
  const senderBalanceWithoutTransfer = senderCurrentBalance + (editTx?.amount ?? 0);
  // New amount must not exceed what the sender has (without this transfer)
  const maxAllowedAmount = senderBalanceWithoutTransfer;
  const editAmountNum = parseFloat(editAmount);
  const editAmountInvalid = !isNaN(editAmountNum) && (editAmountNum <= 0 || editAmountNum > maxAllowedAmount);

  const handleSaveEdit = () => {
    if (!editTx || !onEdit) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0 || amt > maxAllowedAmount) return;
    onEdit(editTx.id, { amount: amt, tracked: editTracked });
    setEditTx(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTx || !onDelete) return;
    setDeleteLoading(true);
    try {
      await onDelete(deleteTx.id);
    } finally {
      setDeleteLoading(false);
      setDeleteTx(null);
    }
  };

  return (
    <>
      <Paper elevation={2}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Receiver</TableCell>
                <TableCell align="right">Amount</TableCell>
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
                : transfers.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography sx={{ color: 'text.secondary' }}>No transfers recorded.</Typography>
                      </TableCell>
                    </TableRow>
                  )
                  : transfers.map((tx) => (
                    <TableRow
                      key={tx.id}
                      hover
                      sx={{ opacity: tx.tracked ? 1 : 0.6 }}
                    >
                      <TableCell>{formatDateTime(tx.time)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 500 }}>{tx.senderName}</Typography>
                          <Chip
                            label={tx.senderFaction}
                            color={getFactionColor(tx.senderFaction)}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 500 }}>{tx.receiverName}</Typography>
                          <Chip
                            label={tx.receiverFaction}
                            color={getFactionColor(tx.receiverFaction)}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(tx.amount)}
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
                            <IconButton size="small" onClick={() => openEdit(tx)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {onDelete && (
                            <IconButton size="small" color="error" onClick={() => setDeleteTx(tx)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onClose={() => setEditTx(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Transfer</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editTx && (
              <Typography variant="body2" color="text.secondary">
                {editTx.senderName} → {editTx.receiverName}
              </Typography>
            )}
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              required
              error={editAmountInvalid}
              helperText={
                editAmountInvalid
                  ? editAmountNum <= 0
                    ? 'Amount must be greater than 0'
                    : `Sender can afford at most ${formatCurrency(maxAllowedAmount)} (would go negative)`
                  : `Sender balance available: ${formatCurrency(maxAllowedAmount)}`
              }
              slotProps={{ htmlInput: { min: 1, max: maxAllowedAmount } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editTracked}
                  onChange={(e) => setEditTracked(e.target.checked)}
                />
              }
              label="Tracked (Affects Balances)"
            />
            {nameSummaries && editTx && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                After edit: sender will have{' '}
                <strong>{formatCurrency(senderBalanceWithoutTransfer - (isNaN(editAmountNum) ? 0 : editAmountNum))}</strong>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTx(null)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editAmountInvalid || isNaN(editAmountNum) || editAmountNum <= 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTx}
        title="Delete Transfer"
        message={
          deleteTx
            ? `Delete transfer of ${formatCurrency(deleteTx.amount)} from ${deleteTx.senderName} to ${deleteTx.receiverName}? This will revert both balances.`
            : ''
        }
        confirmLabel="Delete"
        severity="error"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTx(null)}
      />
    </>
  );
}
