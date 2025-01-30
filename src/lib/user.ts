import { supabase } from './supabase';
import type { UserFilters, UserSort, Profile, UserStatus } from '../types/user';

export async function getUsers(
  filters: UserFilters = {},
  sort: UserSort = { field: 'created_at', direction: 'desc' },
  page = 1,
  pageSize = 10
) {
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,id.eq.${filters.search}`);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      users: data,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
  performedBy: string
) {
  const { error } = await supabase.rpc('update_user_status', {
    user_id: userId,
    new_status: status,
    admin_id: performedBy,
  });

  if (error) throw error;
}

export async function softDeleteUser(userId: string, performedBy: string) {
  const { error } = await supabase.rpc('soft_delete_user', {
    user_id: userId,
    admin_id: performedBy,
  });

  if (error) throw error;
}

export async function getUserAuditLogs(userId: string) {
  const { data, error } = await supabase
    .from('user_audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>,
  performedBy: string
) {
  const { error } = await supabase.rpc('update_user_profile', {
    user_id: userId,
    profile_updates: updates,
    admin_id: performedBy,
  });

  if (error) throw error;
}