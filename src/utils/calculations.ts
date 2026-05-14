import type { ResolvedTransaction, NameSummary, FactionSummary, SortConfig, FactionConfig } from '../types';

export function getStartingValues(factionConfigs: FactionConfig[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const cfg of factionConfigs) {
    result[cfg.faction] = cfg.startingValue;
  }
  return result;
}

export function aggregateByName(transactions: ResolvedTransaction[]): NameSummary[] {
  const map = new Map<string, NameSummary>();

  for (const tx of transactions) {
    if (!tx.tracked) continue;
    const existing = map.get(tx.name);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
      existing.transactions.push(tx);
    } else {
      map.set(tx.name, {
        name: tx.name,
        faction: tx.faction,
        total: tx.amount,
        count: 1,
        transactions: [tx],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function aggregateByFaction(
  transactions: ResolvedTransaction[],
  factionConfigs: FactionConfig[],
  factions: string[],
): FactionSummary[] {
  const startingValues = getStartingValues(factionConfigs);
  const map = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    if (!tx.tracked) continue;
    const existing = map.get(tx.faction);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      map.set(tx.faction, { total: tx.amount, count: 1 });
    }
  }

  return factions.map((faction) => {
    const data = map.get(faction) ?? { total: 0, count: 0 };
    const startingValue = startingValues[faction] ?? 0;
    const diff = data.total;
    const currentValue = startingValue + diff;
    const diffPercent = startingValue > 0 ? (diff / startingValue) * 100 : 0;
    return {
      faction,
      startingValue,
      total: data.total,
      currentValue,
      diff,
      diffPercent,
      count: data.count,
    };
  });
}

export function sortTransactions(transactions: ResolvedTransaction[], sort: SortConfig): ResolvedTransaction[] {
  return [...transactions].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'time':
        cmp = new Date(a.time).getTime() - new Date(b.time).getTime();
        break;
      case 'amount':
        cmp = a.amount - b.amount;
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'faction':
        cmp = a.faction.localeCompare(b.faction);
        break;
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

export function filterByName(transactions: ResolvedTransaction[], search: string): ResolvedTransaction[] {
  if (!search.trim()) return transactions;
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  return transactions.filter((tx) => {
    const name = tx.name.toLowerCase();
    return terms.every((term) => name.includes(term));
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateStr));
}

export function getLocalDatetimeLocal(date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildTimeSeriesData(
  transactions: ResolvedTransaction[],
): { time: string; [name: string]: number | string }[] {
  const tracked = transactions.filter((tx) => tx.tracked);
  if (tracked.length === 0) return [];

  const sorted = [...tracked].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const topNames = aggregateByName(transactions)
    .slice(0, 5)
    .map((s) => s.name);

  const hourMap = new Map<string, Record<string, number>>();

  for (const tx of sorted) {
    if (!topNames.includes(tx.name)) continue;
    const d = new Date(tx.time);
    const hourKey = `${d.toLocaleDateString('de-DE')} ${d.getHours().toString().padStart(2, '0')}:00`;
    const entry = hourMap.get(hourKey) ?? {};
    entry[tx.name] = (entry[tx.name] ?? 0) + tx.amount;
    hourMap.set(hourKey, entry);
  }

  const cumulative: Record<string, number> = {};
  const result: { time: string; [name: string]: number | string }[] = [];

  for (const [time, hourData] of hourMap.entries()) {
    for (const name of topNames) {
      cumulative[name] = (cumulative[name] ?? 0) + (hourData[name] ?? 0);
    }
    result.push({ time, ...cumulative });
  }

  return result;
}

export function buildFactionTimeSeriesData(
  transactions: ResolvedTransaction[],
  factionConfigs: FactionConfig[],
  factions: string[],
): { time: string; [faction: string]: number | string }[] {
  const tracked = transactions.filter((tx) => tx.tracked);
  if (tracked.length === 0) return [];

  const startingValues = getStartingValues(factionConfigs);
  const sorted = [...tracked].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const hourMap = new Map<string, Record<string, number>>();

  for (const tx of sorted) {
    const d = new Date(tx.time);
    const hourKey = `${d.toLocaleDateString('de-DE')} ${d.getHours().toString().padStart(2, '0')}:00`;
    const entry = hourMap.get(hourKey) ?? {};
    entry[tx.faction] = (entry[tx.faction] ?? 0) + tx.amount;
    hourMap.set(hourKey, entry);
  }

  const cumulative: Record<string, number> = {};
  for (const f of factions) cumulative[f] = startingValues[f] ?? 0;

  const result: { time: string; [faction: string]: number | string }[] = [];

  for (const [time, hourData] of hourMap.entries()) {
    for (const f of factions) {
      cumulative[f] = (cumulative[f] ?? 0) + (hourData[f] ?? 0);
    }
    result.push({ time, ...cumulative });
  }

  return result;
}
