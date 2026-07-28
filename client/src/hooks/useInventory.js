import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../lib/api';
import toast from 'react-hot-toast';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: inventoryApi.getAlerts,
    refetchInterval: 60000,
  });
}

export function useInventoryHistory(params) {
  return useQuery({
    queryKey: ['inventory-history', params],
    queryFn: () => inventoryApi.getHistory(params),
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.stockIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock received successfully');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to receive stock'),
  });
}

export function useStockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.stockOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock removed successfully');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove stock'),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.adjust,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock adjusted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to adjust stock'),
  });
}
