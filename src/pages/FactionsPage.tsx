import { useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Grid, TextField,
  Button, InputAdornment, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useTransactionContext } from '../hooks/transactionContext';
import { FACTIONS } from '../types';
import type { Faction } from '../types';
import { formatCurrency, getStartingValues, aggregateByFaction } from '../utils/calculations';

const FACTION_PALETTE: Record<string, string> = {
  Miliz: '#1976d2',
  KGG: '#f44336',
  GOF: '#ffc107',
  Enklave: '#ed6c02',
};

function FactionCard({ faction, startingValue, currentValue, diff, diffPercent, onUpdateStart, onAddMoney }: {
  faction: Faction;
  startingValue: number;
  currentValue: number;
  diff: number;
  diffPercent: number;
  onUpdateStart: (v: number) => Promise<void>;
  onAddMoney: (amount: number) => Promise<void>;
}) {
  const [editingStart, setEditingStart] = useState(false);
  const [startValue, setStartValue] = useState(startingValue.toString());
  const [addAmount, setAddAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveStart = async () => {
    const num = parseFloat(startValue);
    if (!isNaN(num)) {
      await onUpdateStart(num);
    }
    setEditingStart(false);
  };

  const handleAdd = async () => {
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt === 0) return;
    setSaving(true);
    try {
      await onAddMoney(amt);
      setAddAmount('');
    } finally {
      setSaving(false);
    }
  };

  const isPositive = diff >= 0;

  return (
    <Card elevation={3} sx={{ borderTop: 4, borderColor: FACTION_PALETTE[faction] }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{faction}</Typography>
            <Chip
              label={`${isPositive ? '+' : ''}${diffPercent.toFixed(1)}%`}
              size="small"
              color={isPositive ? 'success' : diff === 0 ? 'default' : 'error'}
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Current Value
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {formatCurrency(currentValue)}
            </Typography>
            <Typography variant="body2" sx={{ color: isPositive ? 'success.main' : 'error.main', mt: 0.5 }}>
              {isPositive ? '+' : ''}{formatCurrency(diff)} from start
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Starting Value
            </Typography>
            {editingStart ? (
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  type="number"
                  value={startValue}
                  onChange={(e) => setStartValue(e.target.value)}
                  autoFocus
                  fullWidth
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveStart(); if (e.key === 'Escape') setEditingStart(false); }}
                />
                <Button variant="contained" size="small" onClick={handleSaveStart}>Save</Button>
              </Stack>
            ) : (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>{formatCurrency(startingValue)}</Typography>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => { setEditingStart(true); setStartValue(startingValue.toString()); }}
                >
                  Edit
                </Button>
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Add / Remove Funds
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                type="number"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                fullWidth
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={saving || !addAmount || parseFloat(addAmount) === 0}
              >
                Add
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Use negative values to remove funds
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function FactionsPage() {
  const { factionConfigs, updateFactionStartValue, transactions, createTransaction } = useTransactionContext();
  const startingValues = getStartingValues(factionConfigs);
  const summaries = useMemo(() => aggregateByFaction(transactions, factionConfigs), [transactions, factionConfigs]);

  const handleAddMoney = async (faction: Faction, amount: number) => {
    await createTransaction({
      name: `[${faction} Bank]`,
      amount,
      faction,
      time: new Date().toISOString(),
      tracked: true,
    });
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Faction Settings</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Manage starting values and inject additional funds into factions.
        </Typography>
        <Grid container spacing={3}>
          {FACTIONS.map((f) => {
            const summary = summaries.find((s) => s.faction === f);
            return (
              <Grid key={f} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <FactionCard
                  faction={f}
                  startingValue={startingValues[f]}
                  currentValue={summary?.currentValue ?? startingValues[f]}
                  diff={summary?.diff ?? 0}
                  diffPercent={summary?.diffPercent ?? 0}
                  onUpdateStart={(v) => updateFactionStartValue(f, v)}
                  onAddMoney={(amt) => handleAddMoney(f, amt)}
                />
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Box>
  );
}
