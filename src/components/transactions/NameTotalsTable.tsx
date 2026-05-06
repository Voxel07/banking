import { useState, useMemo } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Box, TableSortLabel,
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
  title?: string;
  headerAction?: React.ReactNode;
}

type SortField = 'name' | 'count' | 'total';

export default function NameTotalsTable({ summaries, title = 'Rankings (Tracked Only)', headerAction }: Props) {
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'count') cmp = a.count - b.count;
      else if (sortField === 'total') cmp = a.total - b.total;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [summaries, sortField, sortDir]);

  const rankings = useMemo(() => {
    const sorted = [...summaries].sort((a, b) => b.total - a.total);
    const map = new Map<string, number>();
    sorted.forEach((s, i) => map.set(s.name, i));
    return map;
  }, [summaries]);

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
        {headerAction && <Box sx={{ flexGrow: 1, maxWidth: 400 }}>{headerAction}</Box>}
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Faction</TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortField === 'count'} direction={sortField === 'count' ? sortDir : 'asc'} onClick={() => handleSort('count')}>
                  Transactions
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortField === 'total'} direction={sortField === 'total' ? sortDir : 'asc'} onClick={() => handleSort('total')}>
                  Total
                </TableSortLabel>
              </TableCell>
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
              : sortedSummaries.map((s) => {
                const rank = rankings.get(s.name) ?? -1;
                return (
                <TableRow key={s.name} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {rank >= 0 && rank < 3 && (
                        <Chip
                          label={`#${rank + 1}`}
                          size="small"
                          color={rank === 0 ? 'warning' : 'default'}
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
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
