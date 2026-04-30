import { Box, Card, CardContent, Typography, Avatar, Stack, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { NameSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#607d8b', '#607d8b'];

const FACTION_CHIP_COLOR: Record<string, 'primary' | 'error' | 'warning' | 'info'> = {
  Miliz: 'primary',
  KGG: 'error',
  GOF: 'warning',
  Enklave: 'info',
};

interface Props {
  topNames: NameSummary[];
}

export default function TopNameCards({ topNames }: Props) {
  if (topNames.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
        <Typography sx={{ color: 'text.secondary' }}>No data yet</Typography>
      </Box>
    );
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
      {topNames.map((s, i) => (
        <Card
          key={s.name}
          elevation={i === 0 ? 4 : 2}
          sx={{
            flex: '1 1 0',
            minWidth: 160,
            borderTop: 4,
            borderColor: MEDAL_COLORS[i] ?? '#607d8b',
            transform: i === 0 ? 'scale(1.03)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <CardContent>
            <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }} spacing={1}>
              <Avatar sx={{ bgcolor: MEDAL_COLORS[i] ?? '#607d8b', width: 32, height: 32, fontSize: 14 }}>
                {i === 0 ? <EmojiEventsIcon fontSize="small" /> : MEDALS[i]}
              </Avatar>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                #{i + 1}
              </Typography>
            </Stack>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              {s.name}
            </Typography>
            <Chip
              label={s.faction}
              color={FACTION_CHIP_COLOR[s.faction] ?? 'default'}
              size="small"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800, color: 'primary.main' }}>
              {formatCurrency(s.total)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {s.count} transaction{s.count !== 1 ? 's' : ''}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
