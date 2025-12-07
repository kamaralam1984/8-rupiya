/**
 * Role-based Access Control Helper Functions
 * 
 * Ye functions aapko user roles check karne mein help karenge
 */

export type Role = 'admin' | 'editor' | 'operator';

export interface User {
  role: string;
  [key: string]: any;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user has editor role
 */
export function isEditor(user: User | null): boolean {
  return user?.role === 'editor';
}

/**
 * Check if user has operator role
 */
export function isOperator(user: User | null): boolean {
  return user?.role === 'operator';
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as Role);
}

/**
 * Check if user has admin, editor, or operator role
 * (Any privileged role)
 */
export function hasPrivilegedAccess(user: User | null): boolean {
  return hasRole(user, ['admin', 'editor', 'operator']);
}

/**
 * Check if user can edit (admin or editor)
 */
export function canEdit(user: User | null): boolean {
  return hasRole(user, ['admin', 'editor']);
}

/**
 * Check if user can delete (only admin)
 */
export function canDelete(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: 'Administrator',
    editor: 'Editor',
    operator: 'Operator',
    user: 'User',
  };
  return roleNames[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    operator: 'bg-green-100 text-green-800',
    user: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}







