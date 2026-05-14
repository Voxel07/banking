import { Paper, Box, Typography } from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/calculations';

const COLORS = ['#1976d2', '#e91e63', '#2e7d32', '#ff9800', '#9c27b0'];

interface DataPoint {
  time: string;
  [name: string]: number | string;
}

interface Props {
  data: DataPoint[];
  names: string[];
  title?: string;
}

export default function TransactionChart({ data, names, title = 'Cumulative Spending — Top 5 Names' }: Props) {
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
        {title}
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
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
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
