import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Box,
} from '@mui/material';
import type { NameSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

const FACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Miliz: 'primary',
  KGG: 'error',
  GOF: 'warning',
  Enklave: 'info',
};

interface Props {
  summaries: NameSummary[];
}

export default function NameTotalsTable({ summaries }: Props) {
  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Rankings (Tracked Only)</Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Faction</TableCell>
              <TableCell align="right">Transactions</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaries.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No data</Typography>
                  </TableCell>
                </TableRow>
              )
              : summaries.map((s, i) => (
                <TableRow key={s.name} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {i < 3 && (
                        <Chip
                          label={`#${i + 1}`}
                          size="small"
                          color={i === 0 ? 'warning' : 'default'}
                          sx={{ fontWeight: 700, minWidth: 36 }}
                        />
                      )}
                      <Typography sx={{ fontWeight: 500 }}>{s.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.faction} size="small" variant="outlined" color={FACTION_COLORS[s.faction]} />
                  </TableCell>
                  <TableCell align="right">{s.count}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 600 }}>{formatCurrency(s.total)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
