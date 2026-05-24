import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SAMPLE_LEADS, SAMPLE_BOOKINGS, SAMPLE_BOOKING_DETAILS } from '@/data/sample'
import type { Lead, Booking, BookingDetail } from '@/types'

// ── Leads ─────────────────────────────────────────────────────────

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      // TODO: replace with api.get('/leads').then(r => r.data)
      return SAMPLE_LEADS
    },
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async (): Promise<Lead | undefined> => {
      // TODO: replace with api.get(`/leads/${id}`).then(r => r.data)
      return SAMPLE_LEADS.find(l => l.id === id)
    },
    enabled: !!id,
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead['status'] }) => {
      // TODO: replace with api.patch(`/leads/${id}`, { status }).then(r => r.data)
      return { id, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ── Bookings ──────────────────────────────────────────────────────

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async (): Promise<Booking[]> => {
      // TODO: replace with api.get('/bookings').then(r => r.data)
      return SAMPLE_BOOKINGS
    },
  })
}

export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async (): Promise<BookingDetail | undefined> => {
      // TODO: replace with api.get(`/bookings/${id}`).then(r => r.data)
      return SAMPLE_BOOKING_DETAILS[id]
    },
    enabled: !!id,
  })
}

export function useAllBookingDetails() {
  return useQuery({
    queryKey: ['bookings', 'all-details'],
    queryFn: async (): Promise<Record<string, BookingDetail>> => {
      // TODO: replace with api.get('/bookings/details').then(r => r.data)
      return SAMPLE_BOOKING_DETAILS
    },
  })
}

// ── Tasks ─────────────────────────────────────────────────────────

export function useToggleTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, taskId, completed }: {
      bookingId: string
      taskId: string
      completed: boolean
    }) => {
      // TODO: replace with api.patch(`/tasks/${taskId}`, { completed }).then(r => r.data)
      return { bookingId, taskId, completed }
    },
    onMutate: async ({ bookingId, taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', bookingId] })
      const previous = queryClient.getQueryData(['bookings', bookingId])
      queryClient.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map(t =>
            t.id === taskId ? { ...t, completed } : t
          ),
        }
      })
      return { previous }
    },
    onError: (_err, { bookingId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings', bookingId], context.previous)
      }
    },
    onSettled: (_data, _err, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] })
    },
  })
}

// ── Portal ────────────────────────────────────────────────────────

export function usePortalBooking(token: string) {
  return useQuery({
    queryKey: ['portal', token],
    queryFn: async (): Promise<BookingDetail | undefined> => {
      // TODO: replace with api.get(`/portal/${token}`).then(r => r.data)
      // Any booking with portal_enabled = true is accessible by token
      const match = Object.values(SAMPLE_BOOKING_DETAILS).find(
        b => b.portalToken === token && b.portalEnabled
      )
      return match
    },
    enabled: !!token,
  })
}