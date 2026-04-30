import { Card, CardContent, Typography, Grid, Chip, Stack } from '@mui/material';
import type { FactionSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

const FACTION_PALETTE: Record<string, string> = {
  Miliz: '#1976d2',
  KGG: '#f44336',
  GOF: '#ffc107',
  Enklave: '#ed6c02',
};

interface Props {
  summaries: FactionSummary[];
}

export default function FactionCards({ summaries }: Props) {
  return (
    <Grid container spacing={2}>
      {summaries.map((s) => {
        const isPositive = s.diff >= 0;
        return (
          <Grid key={s.faction} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderTop: 4, borderColor: FACTION_PALETTE[s.faction] }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  {s.faction}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatCurrency(s.currentValue)}
                </Typography>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>
                    {isPositive ? '+' : ''}{formatCurrency(s.diff)}
                  </Typography>
                  <Chip
                    label={`${isPositive ? '+' : ''}${s.diffPercent.toFixed(1)}%`}
                    size="small"
                    color={isPositive ? 'success' : s.diff === 0 ? 'default' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  Start: {formatCurrency(s.startingValue)} · {s.count} tx
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
