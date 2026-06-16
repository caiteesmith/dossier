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
    onError: (err, _v, ctx) => {
      console.log('mutation error:', err)
      if (ctx?.prev) qc.setQueryData(['leads'], ctx.prev)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
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

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, taskId, ...data }: {
      bookingId: string; taskId: string
      title?: string; category?: string; dueDate?: string | null
    }) => api.patch(`/api/bookings/${bookingId}/tasks/${taskId}`, data).then(r => r.data),
    onMutate: async ({ bookingId, taskId, ...data }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, tasks: old.tasks.map(t => t.id === taskId ? { ...t, ...data } : t) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, taskId }: { bookingId: string; taskId: string }) =>
      api.delete(`/api/bookings/${bookingId}/tasks/${taskId}`),
    onMutate: async ({ bookingId, taskId }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, tasks: old.tasks.filter(t => t.id !== taskId) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
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

export function useUpdateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, vendorId, ...data }: {
      bookingId: string; vendorId: string
      role?: string; name?: string; phone?: string; email?: string; notes?: string
    }) => api.patch(`/api/bookings/${bookingId}/vendors/${vendorId}`, data).then(r => r.data),
    onMutate: async ({ bookingId, vendorId, ...data }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, vendors: old.vendors.map((v: any) => v.id === vendorId ? { ...v, ...data } : v) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, vendorId }: { bookingId: string; vendorId: string }) =>
      api.delete(`/api/bookings/${bookingId}/vendors/${vendorId}`),
    onMutate: async ({ bookingId, vendorId }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, vendors: old.vendors.filter((v: any) => v.id !== vendorId) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

// ── Shot groups & items ───────────────────────────────────────────

export function useAddShotGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, ...data }: { bookingId: string; name: string; items: string[] }) =>
      api.post(`/api/bookings/${bookingId}/shot-list/groups`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

export function useDeleteShotGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, groupId }: { bookingId: string; groupId: string }) =>
      api.delete(`/api/bookings/${bookingId}/shot-list/groups/${groupId}`),
    onMutate: async ({ bookingId, groupId }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return { ...old, shotListGroups: old.shotListGroups.filter((g: any) => g.id !== groupId) }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

export function useAddShotItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, groupId, description, notes }: {
      bookingId: string; groupId: string; description: string; notes?: string
    }) => api.post(`/api/bookings/${bookingId}/shot-list/groups/${groupId}/items`, { description, notes }).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

export function useDeleteShotItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, groupId, itemId }: { bookingId: string; groupId: string; itemId: string }) =>
      api.delete(`/api/bookings/${bookingId}/shot-list/groups/${groupId}/items/${itemId}`),
    onMutate: async ({ bookingId, groupId, itemId }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return {
          ...old,
          shotListGroups: old.shotListGroups.map((g: any) =>
            g.id === groupId ? { ...g, items: g.items.filter((i: any) => i.id !== itemId) } : g
          ),
        }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

export function useUpdateShotItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, groupId, itemId, description, notes, sortOrder, newGroupId }: {
      bookingId: string; groupId: string; itemId: string
      description?: string; notes?: string; sortOrder?: number; newGroupId?: string
    }) => api.patch(`/api/bookings/${bookingId}/shot-list/items/${itemId}`, {
      ...(description !== undefined && { description }),
      ...(notes !== undefined && { notes }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(newGroupId !== undefined && { groupId: newGroupId }),
    }).then(r => r.data),
    onMutate: async ({ bookingId, groupId, itemId, description, notes }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: BookingDetail | undefined) => {
        if (!old) return old
        return {
          ...old,
          shotListGroups: old.shotListGroups.map((g: any) =>
            g.id === groupId
              ? { ...g, items: g.items.map((i: any) => i.id === itemId ? { ...i, description: description ?? i.description, notes: notes ?? i.notes } : i) }
              : g
          ),
        }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

// ── Timeline blocks ───────────────────────────────────────────────

export function useAddTimelineBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, ...data }: {
      bookingId: string
      title: string
      startTime: string
      durationMinutes: number
      location?: string
      notes?: string
    }) => api.post(`/api/bookings/${bookingId}/timeline/blocks`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

export function useUpdateTimelineBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, blockId, ...data }: {
      bookingId: string
      blockId: string
      title?: string
      startTime?: string
      durationMinutes?: number
      location?: string
      notes?: string
      sortOrder?: number
    }) => api.patch(`/api/bookings/${bookingId}/timeline/blocks/${blockId}`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bookings', vars.bookingId] }),
  })
}

export function useDeleteTimelineBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, blockId }: { bookingId: string; blockId: string }) =>
      api.delete(`/api/bookings/${bookingId}/timeline/blocks/${blockId}`),
    onMutate: async ({ bookingId, blockId }) => {
      await qc.cancelQueries({ queryKey: ['bookings', bookingId] })
      const prev = qc.getQueryData(['bookings', bookingId])
      qc.setQueryData(['bookings', bookingId], (old: any) => {
        if (!old?.timeline) return old
        return { ...old, timeline: { ...old.timeline, blocks: old.timeline.blocks.filter((b: any) => b.id !== blockId) } }
      })
      return { prev }
    },
    onError: (_e, { bookingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['bookings', bookingId], ctx.prev)
    },
    onSettled: (_d, _e, { bookingId }) => qc.invalidateQueries({ queryKey: ['bookings', bookingId] }),
  })
}

// ── Portal (token-based, no JWT) ──────────────────────────────────

export function usePortalBooking(token: string) {
  return useQuery<BookingDetail>({
    queryKey: ['portal', token],
    queryFn: () => api.get(`/api/portal/${token}`, {
      headers: { Authorization: undefined },
      transformRequest: [(data, headers) => {
        delete headers.Authorization
        return data
      }],
    }).then(r => r.data),
    enabled: !!token,
  })
}

// ── Misc ──────────────────────────────────────────────────────────

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/bookings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateWorkflowStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workflowStatus }: { id: string; workflowStatus: string }) =>
      api.patch(`/api/bookings/${id}`, { workflowStatus }).then(r => r.data),
    onMutate: async ({ id, workflowStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', id] })
      const prev = queryClient.getQueryData(['bookings', id])
      queryClient.setQueryData(['bookings', id], (old: any) =>
        old ? { ...old, workflowStatus } : old
      )
      queryClient.setQueryData(['bookings'], (old: any[]) =>
        Array.isArray(old)
          ? old.map(b => b.id === id ? { ...b, workflowStatus } : b)
          : old
      )
      return { prev }
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['bookings', id], ctx.prev)
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useQuestionnaire(bookingId: string) {
  return useQuery<{ answers: Record<string, any>; submittedAt: string | null }>({
    queryKey: ['questionnaire', bookingId],
    queryFn: () => api.get(`/api/bookings/${bookingId}/questionnaire`).then(r => r.data),
    enabled: !!bookingId,
  })
}