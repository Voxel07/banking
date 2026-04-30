import { Paper, Box, Typography } from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { FACTIONS } from '../../types';
import { formatCurrency } from '../../utils/calculations';

const FACTION_COLORS: Record<string, string> = {
  Miliz: '#1976d2',
  KGG: '#f44336',
  GOF: '#ffc107',
  Enklave: '#ed6c02',
};

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
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: 8 }}
              labelStyle={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}
              itemStyle={{ color: '#eee' }}
            />
            <Legend />
            {FACTIONS.map((f) => (
              <Line
                key={f}
                type="monotone"
                dataKey={f}
                name={f}
                stroke={FACTION_COLORS[f]}
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
