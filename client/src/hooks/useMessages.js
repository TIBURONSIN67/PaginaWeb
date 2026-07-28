import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../lib/api';
import toast from 'react-hot-toast';

export function useMessages(params) {
  return useQuery({
    queryKey: ['messages', params],
    queryFn: () => messagesApi.getAll(params),
    refetchInterval: 5000,
  });
}

export function useConversation(phone) {
  return useQuery({
    queryKey: ['conversation', phone],
    queryFn: () => messagesApi.getConversation(phone),
    enabled: !!phone,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagesApi.send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send message'),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: messagesApi.getUnreadCount,
    refetchInterval: 10000,
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: messagesApi.getTransfers,
    refetchInterval: 30000,
  });
}

export function useResolveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagesApi.resolveTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      toast.success('Transfer resolved');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to resolve transfer'),
  });
}
