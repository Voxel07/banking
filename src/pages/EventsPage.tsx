import { useState } from 'react';
import {
  Box, Typography, Stack, Paper, TextField, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Switch, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import { useEventContext } from '../hooks/eventContext';
import { eventService } from '../services/eventService';
import { formatDateTime } from '../utils/calculations';
import type { BankingEvent } from '../types';
import ConfirmDialog from '../components/layout/ConfirmDialog';
import PromptDialog from '../components/layout/PromptDialog';

// Predefined event templates with their default faction sets
const EVENT_TEMPLATES: Record<string, { label: string; defaultFactions: string[] }> = {
  DE: {
    label: 'DE – Dark Emergency',
    defaultFactions: ['Miliz', 'KGG', 'GOF', 'Enklave'],
  },
  TNO: {
    label: 'TNO – Op Teschernobyl',
    defaultFactions: ['Militär', 'Freiheit', 'Banditen', 'Wissenschaftler', 'Stalker', 'Söldner'],
  },
  M24: {
    label: 'M24 – Mission 24',
    defaultFactions: ['Miliz', 'KGG', 'GOF', 'Enklave'],
  },
  ASD: {
    label: 'ASD – Airsoftdays',
    defaultFactions: ['Miliz', 'KGG', 'GOF', 'Enklave'],
  },
};

// ---------- FactionEditor Dialog ----------
function FactionEditorDialog({
  event,
  open,
  onClose,
}: {
  event: BankingEvent;
  open: boolean;
  onClose: () => void;
}) {
  const [factions, setFactions] = useState<string[]>(event.factions ?? []);
  const [newFaction, setNewFaction] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = newFaction.trim();
    if (!trimmed || factions.includes(trimmed)) return;
    setFactions(prev => [...prev, trimmed]);
    setNewFaction('');
  };

  const handleRemove = (f: string) => setFactions(prev => prev.filter(x => x !== f));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await eventService.update(event.id, { factions });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save factions');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (templateKey: string) => {
    const template = EVENT_TEMPLATES[templateKey];
    if (template) setFactions(template.defaultFactions);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Configure Factions — {event.name}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Apply a preset from an event template, or add factions manually.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(EVENT_TEMPLATES).map(([key]) => (
              <Button
                key={key}
                size="small"
                variant="outlined"
                onClick={() => handleApplyTemplate(key)}
              >
                {key}
              </Button>
            ))}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Active Factions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {factions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No factions configured.</Typography>
              ) : factions.map(f => (
                <Chip
                  key={f}
                  label={f}
                  onDelete={() => handleRemove(f)}
                  deleteIcon={<CloseIcon />}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                size="small"
                label="Add Faction"
                value={newFaction}
                onChange={e => setNewFaction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleAdd}
                startIcon={<AddIcon />}
                disabled={!newFaction.trim() || factions.includes(newFaction.trim())}
                size="small"
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save Factions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Main Page ----------
export default function EventsPage() {
  const { events, activeEvent, setActiveEventId } = useEventContext();
  const [newEventName, setNewEventName] = useState('');
  const [newEventFactions, setNewEventFactions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Faction editor
  const [editingFactions, setEditingFactions] = useState<BankingEvent | null>(null);

  // Rename dialog state
  const [renamingEvent, setRenamingEvent] = useState<BankingEvent | null>(null);

  // Delete dialog state
  const [deletingEvent, setDeletingEvent] = useState<BankingEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const templateMatch = Object.entries(EVENT_TEMPLATES).find(
    ([key]) => newEventName.toUpperCase().startsWith(key)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await eventService.create(newEventName.trim(), false, newEventFactions);
      setNewEventName('');
      setNewEventFactions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await eventService.update(id, { active: !currentActive });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  const handleRename = async (newName: string) => {
    if (!renamingEvent) return;
    try {
      await eventService.update(renamingEvent.id, { name: newName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename event');
    } finally {
      setRenamingEvent(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      await eventService.delete(deletingEvent.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
      setDeletingEvent(null);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Events Management</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Manage banking events. Each event has its own set of factions. The active event in the
          navbar controls which transactions are shown globally.
        </Typography>

        {/* Create Event */}
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Create Event</Typography>
          <Box component="form" onSubmit={handleCreate}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
                <TextField
                  label="Event Name"
                  value={newEventName}
                  onChange={(e) => {
                    setNewEventName(e.target.value);
                    const match = Object.entries(EVENT_TEMPLATES).find(
                      ([key]) => e.target.value.toUpperCase().startsWith(key)
                    );
                    if (match) setNewEventFactions(match[1].defaultFactions);
                  }}
                  required
                  fullWidth
                  size="small"
                  helperText={templateMatch ? `Template detected: ${templateMatch[1].label}` : undefined}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  disabled={submitting || !newEventName.trim()}
                  sx={{ minWidth: 120 }}
                >
                  Create
                </Button>
              </Stack>

              {newEventFactions.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Factions that will be created with this event:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {newEventFactions.map(f => (
                      <Chip
                        key={f}
                        label={f}
                        size="small"
                        onDelete={() => setNewEventFactions(prev => prev.filter(x => x !== f))}
                        deleteIcon={<CloseIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        {/* Events Table */}
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Factions</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>DB Active</TableCell>
                  <TableCell>Your Session</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: 'text.secondary' }}>No events found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map(ev => {
                    const isSessionActive = activeEvent?.id === ev.id;
                    return (
                      <TableRow key={ev.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{ev.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(ev.factions ?? []).length === 0 ? (
                              <Typography variant="caption" color="text.secondary">None</Typography>
                            ) : (ev.factions ?? []).map(f => (
                              <Chip key={f} label={f} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDateTime(ev.created)}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={ev.active} 
                            onChange={() => handleToggleActive(ev.id, ev.active)} 
                          />
                        </TableCell>
                        <TableCell>
                          {isSessionActive ? (
                            <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />
                          ) : (
                            <Button size="small" onClick={() => setActiveEventId(ev.id)}>
                              Select
                            </Button>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Configure Factions">
                              <IconButton size="small" color="primary" onClick={() => setEditingFactions(ev)}>
                                <GroupsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rename Event">
                              <IconButton size="small" onClick={() => setRenamingEvent(ev)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton size="small" color="error" onClick={() => setDeletingEvent(ev)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {/* Faction Editor Dialog */}
      {editingFactions && (
        <FactionEditorDialog
          event={editingFactions}
          open={!!editingFactions}
          onClose={() => setEditingFactions(null)}
        />
      )}

      {/* Rename Dialog */}
      <PromptDialog
        open={!!renamingEvent}
        title="Rename Event"
        label="New Event Name"
        initialValue={renamingEvent?.name ?? ''}
        confirmLabel="Rename"
        onConfirm={handleRename}
        onCancel={() => setRenamingEvent(null)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingEvent}
        title="Delete Event"
        message={
          deletingEvent
            ? `Are you sure you want to delete "${deletingEvent.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        severity="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEvent(null)}
      />
    </Box>
  );
}
