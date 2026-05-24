import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Lead, Booking, BookingDetail, TaskCategory } from '@/types'

// ── Leads ─────────────────────────────────────────────────────────

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: () => api.get('/api/leads').then(r => r.data),
  })
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) =>
      api.patch(`/api/leads/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['leads'] })
      const prev = qc.getQueryData<Lead[]>(['leads'])
      qc.setQueryData<Lead[]>(['leads'], old =>
        old?.map(l => l.id === id ? { ...l, status } : l)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['leads'], ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useAddLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Lead, 'id' | 'photographerId' | 'status' | 'inquiryDate' | 'createdAt' | 'updatedAt'>) =>
      api.post('/api/leads', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// ── Bookings ──────────────────────────────────────────────────────

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: () => api.get('/api/bookings').then(r => r.data),
  })
}

export function useBookingDetail(id: string) {
  return useQuery<BookingDetail>({
    queryKey: ['bookings', id],
    queryFn: () => api.get(`/api/bookings/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useAllBookingDetails() {
  return useQuery<Record<string, BookingDetail>>({
    queryKey: ['bookings', 'all-details'],
    queryFn: async () => {
      const bookings: Booking[] = await api.get('/api/bookings').then(r => r.data)
      const details = await Promise.all(
        bookings.map(b => api.get(`/api/bookings/${b.id}`).then(r => r.data))
      )
      return Object.fromEntries(details.map((d: BookingDetail) => [d.id, d]))
    },
  })
}

export function useAddBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Booking>) =>
      api.post('/api/bookings', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Booking> & { id: string }) =>
      api.patch(`/api/bookings/${id}`, data).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings', vars.id] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// ── Tasks ─────────────────────────────────────────────────────────

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, taskId, completed }: { bookingId: string; taskId: string; completed: boolean }) =>
      api.patch(`/api/bookings/${bookingId}/tasks/${taskId}`, { completed }),
    onMutate: async ({ bookingId, taskId, completed }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, tasks: old.tasks.map(t => t.id === taskId ? { ...t, completed } : t) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

export function useAddTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, ...data }: { bookingId: string; title: string; category: TaskCategory; dueDate?: string }) =>
      api.post(`/api/bookings/${bookingId}/tasks`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

// ── Vendors ───────────────────────────────────────────────────────

export function useAddVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, ...data }: { bookingId: string; role: string; name: string; phone?: string; email?: string; notes?: string }) =>
      api.post(`/api/bookings/${bookingId}/vendors`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

// ── Shot groups ───────────────────────────────────────────────────

export function useAddShotGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, ...data }: { bookingId: string; name: string; items: string[] }) =>
      api.post(`/api/bookings/${bookingId}/shot-list/groups`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

// ── Portal (token-based, no JWT) ──────────────────────────────────

export function usePortalBooking(token: string) {
  return useQuery<BookingDetail>({
    queryKey: ['portal', token],
    queryFn: () => api.get(`/api/portal/${token}`, {
      // Portal requests don't need a JWT — remove the auth header
      headers: { Authorization: undefined },
      transformRequest: [(data, headers) => {
        delete headers.Authorization
        return data
      }],
    }).then(r => r.data),
    enabled: !!token,
  })
}