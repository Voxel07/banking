import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, Paper, TextField, Button, Alert, Autocomplete } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useTransactionContext } from '../hooks/transactionContext';
import { useEventContext } from '../hooks/eventContext';
import { transferService } from '../services/transferService';
import type { ResolvedTransfer } from '../types';
import { aggregateByName, formatCurrency } from '../utils/calculations';
import TransferTable from '../components/transactions/TransferTable';

export default function TransfersPage() {
  const { names, ensureName, transactions } = useTransactionContext();
  const { activeEvent } = useEventContext();
  
  const [transfers, setTransfers] = useState<ResolvedTransfer[]>([]);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameStrings = names.map(n => n.name);
  
  const nameSummaries = useMemo(() => aggregateByName(transactions), [transactions]);
  const senderBalance = useMemo(() => nameSummaries.find(s => s.name === sender)?.total ?? 0, [nameSummaries, sender]);
  const receiverBalance = useMemo(() => nameSummaries.find(s => s.name === receiver)?.total ?? 0, [nameSummaries, receiver]);
  
  const transferAmt = parseFloat(amount) || 0;
  const senderPreview = senderBalance - transferAmt;
  const receiverPreview = receiverBalance + transferAmt;

  useEffect(() => {
    let cancelled = false;
    transferService.getAll(activeEvent?.id).then(data => {
      if (!cancelled) setTransfers(data);
    }).catch(() => {
      if (!cancelled) setError('Failed to load transfers');
    });

    const unsub = transferService.subscribe((tx, action) => {
      if (cancelled) return;
      setTransfers(prev => {
        switch (action) {
          case 'create': {
            if (prev.some(t => t.id === tx.id)) return prev;
            return [tx, ...prev];
          }
          case 'update':
            return prev.map(t => t.id === tx.id ? tx : t);
          case 'delete':
            return prev.filter(t => t.id !== tx.id);
          default: return prev;
        }
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [activeEvent?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    
    if (!sender.trim() || !receiver.trim()) return setError('Sender and Receiver are required');
    if (sender.trim() === receiver.trim()) return setError('Sender and Receiver cannot be the same');
    if (isNaN(amt) || amt <= 0) return setError('Amount must be greater than zero');
    
    if (senderBalance <= 0) return setError('Sender has insufficient funds (balance is zero or negative)');
    if (amt > senderBalance) return setError(`Amount exceeds sender's available balance (${formatCurrency(senderBalance)})`);

    setSubmitting(true);
    try {
      const senderName = names.find(n => n.name === sender.trim());
      const receiverName = names.find(n => n.name === receiver.trim());
      
      const s = await ensureName(sender.trim(), senderName?.faction ?? 'Unknown');
      const r = await ensureName(receiver.trim(), receiverName?.faction ?? 'Unknown');

      await transferService.create({
        senderId: s.id,
        receiverId: r.id,
        amount: amt,
        time: new Date().toISOString(),
        tracked: true,
        eventId: activeEvent?.id,
      });

      setSender('');
      setReceiver('');
      setAmount('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Player Transfers</Typography>
        
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>New Transfer</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
              {success && <Alert severity="success">Transfer completed successfully</Alert>}
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Autocomplete
                    freeSolo
                    options={nameStrings}
                    value={sender}
                    onInputChange={(_, v) => setSender(v)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Sender" 
                        required 
                        fullWidth 
                      />
                    )}
                  />
                  {sender && (
                    <Box sx={{ mt: 1, pl: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Balance: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatCurrency(senderBalance)}</Box>
                      </Typography>
                      {transferAmt > 0 && (
                        <Typography variant="body2" color={senderPreview < 0 ? 'error.main' : 'text.secondary'}>
                          After Transfer: <Box component="span" sx={{ fontWeight: 'bold', color: senderPreview < 0 ? 'error.main' : 'warning.main' }}>{formatCurrency(senderPreview)}</Box>
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
                <SwapHorizIcon color="action" sx={{ mt: { sm: 2 } }} />
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Autocomplete
                    freeSolo
                    options={nameStrings}
                    value={receiver}
                    onInputChange={(_, v) => setReceiver(v)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Receiver" 
                        required 
                        fullWidth 
                      />
                    )}
                  />
                  {receiver && (
                    <Box sx={{ mt: 1, pl: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Balance: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatCurrency(receiverBalance)}</Box>
                      </Typography>
                      {transferAmt > 0 && (
                        <Typography variant="body2" color="success.main">
                          After Transfer: <Box component="span" sx={{ fontWeight: 'bold' }}>{formatCurrency(receiverPreview)}</Box>
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
                <TextField
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    if (valStr === '' || valStr.endsWith('.')) {
                      setAmount(valStr);
                      return;
                    }
                    let val = parseFloat(valStr);
                    if (!isNaN(val)) {
                      if (val < 0) val = 0;
                      if (sender && val > senderBalance) val = Math.max(0, senderBalance);
                      setAmount(val.toString());
                    } else {
                      setAmount(valStr);
                    }
                  }}
                  required
                  sx={{ width: 150 }}
                  slotProps={{ htmlInput: { min: 0, max: sender ? Math.max(0, senderBalance) : undefined } }}
                />
              </Stack>

              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting || (!!sender && senderBalance <= 0)} 
                sx={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Processing...' : 'Transfer Funds'}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>Recent Transfers</Typography>
          <TransferTable 
            transfers={transfers} 
            loading={!transfers.length && !error}
            nameSummaries={nameSummaries}
            onDelete={async (id) => {
              try {
                await transferService.delete(id);
                const fresh = await transferService.getAll(activeEvent?.id);
                setTransfers(fresh);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete transfer');
              }
            }}
            onEdit={async (id, data) => {
              try {
                await transferService.update(id, data);
                const fresh = await transferService.getAll(activeEvent?.id);
                setTransfers(fresh);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update transfer');
              }
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
