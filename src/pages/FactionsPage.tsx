import { useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Grid, TextField,
  Button, InputAdornment, Chip, Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import { useTransactionContext } from '../hooks/transactionContext';
import { useEventContext } from '../hooks/eventContext';
import { formatCurrency, getLocalDatetimeLocal, getStartingValues, aggregateByFaction } from '../utils/calculations';

// Generate a deterministic color from a string (for unknown factions)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

const FACTION_PALETTE_FIXED: Record<string, string> = {
  Miliz: '#1976d2',
  KGG: '#f44336',
  GOF: '#ffc107',
  Enklave: '#ed6c02',
  'Militär': '#1565c0',
  'Freiheit': '#2e7d32',
  'Banditen': '#b71c1c',
  'Wissenschaftler': '#6a1b9a',
  'Stalker': '#e65100',
  'Söldner': '#00695c',
};

function getFactionColor(faction: string): string {
  return FACTION_PALETTE_FIXED[faction] ?? stringToColor(faction);
}

function FactionCard({
  faction, startingValue, currentValue, diff, diffPercent, userCount,
  onUpdateStart, onAddMoney,
}: {
  faction: string;
  startingValue: number;
  currentValue: number;
  diff: number;
  diffPercent: number;
  userCount: number;
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
  const borderColor = getFactionColor(faction);

  return (
    <Card elevation={3} sx={{ borderTop: 4, borderColor }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{faction}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip
                icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={userCount}
                size="small"
                variant="outlined"
                color="default"
              />
              <Chip
                label={`${isPositive ? '+' : ''}${diffPercent.toFixed(1)}%`}
                size="small"
                color={isPositive ? 'success' : diff === 0 ? 'default' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
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
  const { factionConfigs, updateFactionStartValue, transactions, createTransaction, names } = useTransactionContext();
  const { activeEvent } = useEventContext();

  // Use factions from the active event, fall back to all unique faction names in configs + transactions
  const factions = useMemo<string[]>(() => {
    if (activeEvent?.factions && activeEvent.factions.length > 0) {
      return activeEvent.factions;
    }
    // Fallback: collect all unique faction names from factionConfigs and names
    const fromConfigs = factionConfigs.map(c => c.faction);
    const fromNames = names.map(n => n.faction);
    return [...new Set([...fromConfigs, ...fromNames])].filter(Boolean).sort();
  }, [activeEvent, factionConfigs, names]);

  const startingValues = getStartingValues(factionConfigs);
  const summaries = useMemo(
    () => aggregateByFaction(transactions, factionConfigs, factions),
    [transactions, factionConfigs, factions],
  );


  const userCountByFaction = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of factions) {
      counts[f] = names.filter(n => n.faction === f).length;
    }
    return counts;
  }, [factions, names]);

  const handleAddMoney = async (faction: string, amount: number) => {
    await createTransaction({
      name: `[${faction} Bank]`,
      amount,
      faction,
      time: getLocalDatetimeLocal(),
      tracked: true,
    });
  };

  if (factions.length === 0) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="info">
          No factions configured for the current event. Go to the <strong>Events</strong> tab and configure factions for the active event.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Faction Settings</Typography>
          {activeEvent && (
            <Typography variant="body2" color="text.secondary">
              Event: <strong>{activeEvent.name}</strong>
            </Typography>
          )}
        </Stack>
        <Typography sx={{ color: 'text.secondary' }}>
          Manage starting values and inject additional funds into factions.
        </Typography>
        <Grid container spacing={3}>
          {factions.map((f) => {
            const summary = summaries.find((s) => s.faction === f);
            return (
              <Grid key={f} size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <FactionCard
                  faction={f}
                  startingValue={startingValues[f] ?? 0}
                  currentValue={summary?.currentValue ?? (startingValues[f] ?? 0)}
                  diff={summary?.diff ?? 0}
                  diffPercent={summary?.diffPercent ?? 0}
                  userCount={userCountByFaction[f] ?? 0}
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
