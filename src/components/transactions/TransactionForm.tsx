import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Paper,
  Typography,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { TransactionCreateData, Faction, Name } from '../../types';
import { FACTIONS } from '../../types';
import type { Transaction } from '../../types';

interface Props {
  names: Name[];
  transactions: Transaction[];
  onSubmit: (data: TransactionCreateData) => Promise<void>;
}

export default function TransactionForm({ names, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [faction, setFaction] = useState<Faction>('Miliz');
  const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameStrings = names.map((n) => n.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (!name.trim()) return setError('Name is required');
    if (isNaN(amt) || amt === 0) return setError('Amount must not be zero');

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), amount: amt, faction, time: new Date(time).toISOString() });
      setName('');
      setAmount('');
      setTime(new Date().toISOString().slice(0, 16));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        New Transaction
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success">Transaction created successfully</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
              freeSolo
              options={nameStrings}
              value={name}
              onInputChange={(_, v) => {
                setName(v);
                // Auto-fill faction if name matches a known entry
                const match = names.find((n) => n.name === v);
                if (match) setFaction(match.faction);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Name" required fullWidth />
              )}
              sx={{ flex: 2 }}
            />
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                },
              }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Faction"
              value={faction}
              onChange={(e) => setFaction(e.target.value as Faction)}
              sx={{ flex: 1 }}
            >
              {FACTIONS.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              sx={{ flex: 2 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={submitting}
            sx={{ alignSelf: 'flex-start' }}
          >
            {submitting ? 'Adding…' : 'Add Transaction'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
