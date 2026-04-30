import { Paper, Box, Typography } from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/calculations';

const COLORS = ['#1976d2', '#e91e63', '#2e7d32'];

interface DataPoint {
  date: string;
  [name: string]: number | string;
}

interface Props {
  data: DataPoint[];
  names: string[];
}

export default function TransactionChart({ data, names }: Props) {
  if (data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary' }}>Not enough data for chart</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Cumulative Spending — Top 3 Names
      </Typography>
      <Box sx={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} width={90} />
            <Tooltip
              formatter={(value) => [formatCurrency(value as number), '']}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
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
