import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Box,
} from '@mui/material';
import type { NameSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface Props {
  summaries: NameSummary[];
}

export default function NameTotalsTable({ summaries }: Props) {
  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Totals by Name</Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Transactions</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaries.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
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
                          color={i === 0 ? 'warning' : i === 1 ? 'default' : 'default'}
                          sx={{ fontWeight: 700, minWidth: 36 }}
                        />
                      )}
                      <Typography sx={{ fontWeight: 500 }}>{s.name}</Typography>
                    </Box>
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
