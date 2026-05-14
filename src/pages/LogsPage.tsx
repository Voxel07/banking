import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { logService } from '../services/logService';
import type { ResolvedLog } from '../services/logService';
import { formatDateTime } from '../utils/calculations';

export default function LogsPage() {
  const [logs, setLogs] = useState<ResolvedLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    logService.getAll().then(data => {
      if (!cancelled) {
        setLogs(data);
        setLoading(false);
      }
    });

    const unsub = logService.subscribe((log, action) => {
      if (cancelled) return;
      setLogs(prev => {
        if (action === 'create') return [log, ...prev];
        return prev;
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'LOGIN':
        return 'success';
      case 'DELETE':
      case 'LOGOUT':
        return 'error';
      case 'UPDATE':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Audit Logs</Typography>

      <TableContainer component={Paper} elevation={2} sx={{ maxHeight: '80vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.created)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">{log.userName}</Typography>
                      <Typography variant="caption" color="text.secondary">{log.userRole}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={log.action} color={getActionColor(log.action)} />
                  </TableCell>
                  <TableCell>
                    {log.entity}
                    {log.faction && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {log.faction}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box 
                      component="pre" 
                      sx={{ 
                        m: 0, 
                        p: 1, 
                        bgcolor: 'background.default', 
                        borderRadius: 1, 
                        fontSize: '0.75rem',
                        maxWidth: '400px',
                        overflowX: 'auto'
                      }}
                    >
                      {JSON.stringify(log.details, null, 2)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
