import { Database } from '../lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserAuditLog = Database['public']['Tables']['user_audit_logs']['Row'];

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'user';

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  startDate?: string;
  endDate?: string;
}

export interface UserSort {
  field: keyof Profile;
  direction: 'asc' | 'desc';
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}