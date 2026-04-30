import { useState, useMemo } from 'react';
import type { Transaction, SortConfig, SortField } from '../types';
import { sortTransactions, filterByName } from '../utils/calculations';

export function useTransactionFilters(transactions: Transaction[]) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortConfig>({ field: 'time', direction: 'desc' });

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'desc' },
    );
  };

  const filtered = useMemo(
    () => sortTransactions(filterByName(transactions, search), sort),
    [transactions, search, sort],
  );

  return { search, setSearch, sort, toggleSort, filtered };
}
