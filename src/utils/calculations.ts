import type { Transaction, NameSummary, FactionSummary, Faction, SortConfig } from '../types';
import { FACTION_STARTING_VALUES } from '../types';

export function aggregateByName(transactions: Transaction[]): NameSummary[] {
  const map = new Map<string, NameSummary>();

  for (const tx of transactions) {
    const existing = map.get(tx.name);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
      existing.transactions.push(tx);
    } else {
      map.set(tx.name, {
        name: tx.name,
        total: tx.amount,
        count: 1,
        transactions: [tx],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function aggregateByFaction(transactions: Transaction[]): FactionSummary[] {
  const map = new Map<Faction, { total: number; count: number }>();

  for (const tx of transactions) {
    const existing = map.get(tx.faction);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      map.set(tx.faction, { total: tx.amount, count: 1 });
    }
  }

  return (Object.keys(FACTION_STARTING_VALUES) as Faction[]).map((faction) => {
    const data = map.get(faction) ?? { total: 0, count: 0 };
    const startingValue = FACTION_STARTING_VALUES[faction];
    const diff = data.total;
    const diffPercent = startingValue > 0 ? (diff / startingValue) * 100 : 0;
    return {
      faction,
      startingValue,
      total: data.total,
      diff,
      diffPercent,
      count: data.count,
    };
  });
}

export function sortTransactions(transactions: Transaction[], sort: SortConfig): Transaction[] {
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

export function filterByName(transactions: Transaction[], search: string): Transaction[] {
  if (!search.trim()) return transactions;
  const lower = search.toLowerCase();
  return transactions.filter((tx) => tx.name.toLowerCase().includes(lower));
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

export function buildTimeSeriesData(
  transactions: Transaction[],
): { date: string; [name: string]: number | string }[] {
  if (transactions.length === 0) return [];

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const topNames = aggregateByName(transactions)
    .slice(0, 3)
    .map((s) => s.name);

  const dateMap = new Map<string, Record<string, number>>();

  for (const tx of sorted) {
    if (!topNames.includes(tx.name)) continue;
    const date = new Date(tx.time).toLocaleDateString('de-DE');
    const entry = dateMap.get(date) ?? {};
    entry[tx.name] = (entry[tx.name] ?? 0) + tx.amount;
    dateMap.set(date, entry);
  }

  // Build cumulative series
  const cumulative: Record<string, number> = {};
  const result: { date: string; [name: string]: number | string }[] = [];

  for (const [date, dayData] of dateMap.entries()) {
    for (const name of topNames) {
      cumulative[name] = (cumulative[name] ?? 0) + (dayData[name] ?? 0);
    }
    result.push({ date, ...cumulative });
  }

  return result;
}
