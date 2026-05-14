import { Paper, Box, Typography } from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/calculations';

// Fixed palette for known factions; unknown ones get a generated color
const FACTION_COLORS_FIXED: Record<string, string> = {
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

const CHART_FALLBACK_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c',
  '#d0ed57', '#8dd1e1', '#83a6ed', '#ffb347', '#c0c0c0',
];

function getFactionLineColor(faction: string, index: number): string {
  return FACTION_COLORS_FIXED[faction] ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
}

interface DataPoint {
  time: string;
  [faction: string]: number | string;
}

interface Props {
  data: DataPoint[];
}

export default function FactionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary' }}>Not enough data for faction chart</Typography>
      </Paper>
    );
  }

  // Derive faction keys from the data (all keys except 'time')
  const factionKeys = data.length > 0
    ? Object.keys(data[0]).filter(k => k !== 'time')
    : [];

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Faction Wealth Over Time
      </Typography>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <ResponsiveContainer width="99%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} width={90} />
            <Tooltip
              formatter={(value, name) => [formatCurrency(value as number), name as string]}
              itemSorter={(item) => -(item.value as number)}
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: 8 }}
              labelStyle={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}
            />
            <Legend />
            {factionKeys.map((f, index) => (
              <Line
                key={f}
                type="monotone"
                dataKey={f}
                name={f}
                stroke={getFactionLineColor(f, index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
