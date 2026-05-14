import { useState, useMemo } from "react";
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
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NfcIcon from "@mui/icons-material/Nfc";
import type { Name } from "../../types";
import { getLocalDatetimeLocal } from "../../utils/calculations";
import { useNfcScanner } from "../../hooks/useNfcScanner";
import { nameService } from "../../services/nameService";
import { useTransactionContext } from "../../hooks/transactionContext";
import { useEventContext } from "../../hooks/eventContext";
import { aggregateByName, formatCurrency } from "../../utils/calculations";

interface Props {
  names: Name[];
  onSubmit: (data: {
    name: string;
    amount: number;
    faction: string;
    time: string;
    tracked: boolean;
  }) => Promise<void>;
}

export default function TransactionForm({ names, onSubmit }: Props) {
  const { transactions } = useTransactionContext();
  const { activeEvent } = useEventContext();

  // Factions come from the active event; fall back to unique factions from existing names
  const availableFactions = useMemo<string[]>(() => {
    if (activeEvent?.factions && activeEvent.factions.length > 0) {
      return activeEvent.factions;
    }
    return [...new Set(names.map(n => n.faction).filter(Boolean))].sort();
  }, [activeEvent, names]);

  const defaultFaction = availableFactions[0] ?? '';

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [faction, setFaction] = useState<string>(defaultFaction);
  const [time, setTime] = useState(() => getLocalDatetimeLocal());
  const [tracked, setTracked] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { scan, isScanning, supported, error: nfcError } = useNfcScanner();

  const handleNfcScan = () => {
    scan(async (uid) => {
      try {
        const user = await nameService.findByNfcId(uid);
        if (user) {
          setName(user.name);
          setFaction(user.faction);
        } else {
          setError(`NFC Tag not recognized (UID: ${uid}). Create a user first.`);
        }
      } catch {
        setError('Failed to look up NFC tag.');
      }
    });
  };

  const nameStrings = names.map((n) => n.name);
  const matchedName = names.find((n) => n.name === name.trim());
  const factionLocked = !!matchedName;

  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const currentPersonSummary = nameSummaries.find(n => n.name === name.trim());
  const currentBalance = currentPersonSummary?.total ?? 0;

  const effectiveFaction = matchedName ? matchedName.faction : faction;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (!name.trim()) return setError("Name is required");
    if (isNaN(amt) || amt === 0) return setError("Amount must not be zero");

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: amt,
        faction: effectiveFaction,
        time,
        tracked,
      });
      setName("");
      setAmount("");
      setTime(getLocalDatetimeLocal());
      setTracked(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
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
          {(error || nfcError) && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error || nfcError}
            </Alert>
          )}
          {success && (
            <Alert severity="success">Transaction created successfully</Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 2, width: '100%' }}>
              <Autocomplete
                freeSolo
                options={nameStrings}
                value={name}
                onInputChange={(_, v) => {
                  setName(v);
                  const match = names.find((n) => n.name === v);
                  if (match) setFaction(match.faction);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Name" 
                    required 
                    fullWidth 
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps?.input,
                        endAdornment: (
                          <>
                            {params.slotProps?.input?.endAdornment}
                            {supported && (
                              <InputAdornment position="end">
                                <Tooltip title="Scan NFC Tag">
                                  <IconButton onClick={handleNfcScan} color={isScanning ? "primary" : "default"}>
                                    <NfcIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            )}
                          </>
                        ),
                      }
                    }}
                  />
                )}
              />
              {name.trim() && (
                <Box sx={{ mt: 1, pl: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Balance: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatCurrency(currentBalance)}</Box>
                  </Typography>
                  {amount !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) !== 0 && (
                    <Typography variant="body2" color={currentBalance + parseFloat(amount) < 0 ? 'warning.main' : 'success.main'}>
                      After Transaction: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatCurrency(currentBalance + parseFloat(amount))}</Box>
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">€</InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: "flex-start" }}
          >
            <Box sx={{ flex: 1, width: '100%' }}>
              <TextField
                select
                label="Faction"
                value={effectiveFaction}
                onChange={(e) => setFaction(e.target.value)}
                disabled={factionLocked || availableFactions.length === 0}
                fullWidth
                helperText={factionLocked ? "Locked to user faction" : undefined}
              >
                {availableFactions.length === 0 ? (
                  <MenuItem value="" disabled>No event active — configure factions in Events</MenuItem>
                ) : (
                  availableFactions.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Box>
            <TextField
              label="Time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              sx={{ flex: 2 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={tracked}
                  onChange={(e) => setTracked(e.target.checked)}
                />
              }
              label="Tracked"
              sx={{ pt: 1 }}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={submitting}
            sx={{ alignSelf: "flex-start" }}
          >
            {submitting ? "Adding…" : "Add Transaction"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
