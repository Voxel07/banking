import { useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, IconButton,
  Chip, Collapse, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTransactionContext } from '../hooks/transactionContext';
import { formatCurrency, formatDateTime } from '../utils/calculations';
import type { Name } from '../types';

const FACTION_CHIP_COLOR: Record<string, 'primary' | 'error' | 'warning' | 'info'> = {
  Miliz: 'primary',
  KGG: 'error',
  GOF: 'warning',
  Enklave: 'info',
};

function UserRow({ user, transactions }: { user: Name; transactions: { time: string; amount: number; cumulative: number }[] }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(user.name);
  const { updateName } = useTransactionContext();
  const allTx = useTransactionContext().transactions.filter((tx) => tx.name === user.name);
  const total = allTx.reduce((sum, tx) => sum + tx.amount, 0);

  const handleSave = async () => {
    if (editValue.trim() && editValue.trim() !== user.name) {
      await updateName(user.id, editValue.trim());
    }
    setEditing(false);
  };

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => !editing && setExpanded(!expanded)}>
        <TableCell>
          {editing ? (
            <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
              <TextField
                size="small"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <IconButton size="small" color="success" onClick={handleSave}><CheckIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => { setEditing(false); setEditValue(user.name); }}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
          ) : (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 500 }}>{user.name}</Typography>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </TableCell>
        <TableCell>
          <Chip label={user.faction} size="small" variant="outlined" color={FACTION_CHIP_COLOR[user.faction] ?? 'default'} />
        </TableCell>
        <TableCell align="right">{allTx.length}</TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 600, color: total >= 0 ? 'success.main' : 'error.main' }}>
            {formatCurrency(total)}
          </Typography>
        </TableCell>
        <TableCell>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, border: expanded ? undefined : 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2 }}>
              {transactions.length > 1 && (
                <Box sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
                  <ResponsiveContainer width="99%" height={200}>
                    <LineChart data={transactions}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 10 }} width={80} />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value as number), 'Balance']}
                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: 8 }}
                        labelStyle={{ fontWeight: 600, color: '#fff' }}
                        itemStyle={{ color: '#eee' }}
                      />
                      <Line type="monotone" dataKey="cumulative" stroke="#90caf9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTx.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDateTime(tx.time)}</TableCell>
                      <TableCell align="right" sx={{ color: tx.amount > 0 ? 'success.main' : 'error.main' }}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function UsersPage() {
  const { names, transactions } = useTransactionContext();
  const [search, setSearch] = useState('');

  const filteredNames = useMemo(() => {
    if (!search.trim()) return names;
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return names.filter((n) => {
      const combined = `${n.name} ${n.faction}`.toLowerCase();
      return terms.every((term) => combined.includes(term));
    });
  }, [names, search]);

  const userChartData = useMemo(() => {
    const result: Record<string, { time: string; amount: number; cumulative: number }[]> = {};
    for (const user of names) {
      const userTx = transactions
        .filter((tx) => tx.name === user.name)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      let cum = 0;
      result[user.name] = userTx.map((tx) => {
        cum += tx.amount;
        const d = new Date(tx.time);
        return {
          time: `${d.toLocaleDateString('de-DE')} ${d.getHours().toString().padStart(2, '0')}:00`,
          amount: tx.amount,
          cumulative: cum,
        };
      });
    }
    return result;
  }, [names, transactions]);

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Users</Typography>
        <Paper elevation={2}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Faction</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: 'text.secondary' }}>
                        {names.length === 0 ? 'No users yet' : 'No matching users'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredNames.map((user) => (
                  <UserRow key={user.id} user={user} transactions={userChartData[user.name] ?? []} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Box>
  );
}
