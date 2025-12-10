# Role-Based Access Control Guide (RBAC)

## Overview
Is project mein **Admin**, **Editor**, aur **Operator** roles ke saath role-based access control implement kiya gaya hai.

## Roles aur Unke Permissions

### 1. **Admin** (Administrator)
- **Full Access**: Sab kuch access kar sakta hai
- **Can Do**: 
  - Sab pages access
  - Sab data edit/delete
  - User management
  - System settings
  - Sab operations

### 2. **Editor**
- **Edit Access**: Data edit kar sakta hai, lekin delete nahi
- **Can Do**:
  - Pages view/edit
  - Data create/update
  - Reports view
- **Cannot Do**:
  - Delete operations
  - User management
  - System settings

### 3. **Operator**
- **View Access**: Sirf view kar sakta hai, edit nahi
- **Can Do**:
  - Pages view
  - Reports view
  - Data read
- **Cannot Do**:
  - Edit operations
  - Delete operations
  - Create operations

## Usage Examples

### 1. Client-Side Page Protection (React Components)

#### Example 1: Admin, Editor, ya Operator - kisi bhi ko access
```tsx
'use client';

import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';

export default function SomePage() {
  return (
    <RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
      <div>
        <h1>This page is accessible to Admin, Editor, and Operator</h1>
        {/* Your page content */}
      </div>
    </RoleBasedRouteGuard>
  );
}
```

#### Example 2: Sirf Admin aur Editor
```tsx
'use client';

import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';

export default function EditPage() {
  return (
    <RoleBasedRouteGuard allowedRoles={['admin', 'editor']}>
      <div>
        <h1>This page is only for Admin and Editor</h1>
        {/* Your page content */}
      </div>
    </RoleBasedRouteGuard>
  );
}
```

#### Example 3: Sirf Admin
```tsx
'use client';

import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';

export default function AdminOnlyPage() {
  return (
    <RoleBasedRouteGuard allowedRoles={['admin']}>
      <div>
        <h1>This page is only for Admin</h1>
        {/* Your page content */}
      </div>
    </RoleBasedRouteGuard>
  );
}
```

### 2. Conditional Rendering Based on Roles

```tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { hasRole, canEdit, canDelete } from '@/lib/utils/roleHelpers';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Admin aur Editor ko edit button dikhao */}
      {canEdit(user) && (
        <button>Edit</button>
      )}
      
      {/* Sirf Admin ko delete button dikhao */}
      {canDelete(user) && (
        <button>Delete</button>
      )}
      
      {/* Operator ko sirf view option */}
      {hasRole(user, ['operator']) && (
        <div>View Only Mode</div>
      )}
    </div>
  );
}
```

### 3. API Route Protection (Server-Side)

#### Example 1: Admin, Editor, ya Operator ko access
```typescript
// app/api/admin/shops/route.ts
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async (request: NextRequest) => {
  // Admin, Editor, ya Operator yahan access kar sakte hain
  // Your code here
});
```

#### Example 2: Sirf Admin ko access
```typescript
// app/api/admin/users/route.ts
import { requireAdminOnly } from '@/lib/auth';

export const DELETE = requireAdminOnly(async (request: NextRequest) => {
  // Sirf Admin yahan access kar sakta hai
  // Your code here
});
```

#### Example 3: Admin ya Editor ko access
```typescript
// app/api/admin/shops/[id]/route.ts
import { requireEditor } from '@/lib/auth';

export const PUT = requireEditor(async (request: NextRequest, { params }) => {
  // Admin ya Editor yahan access kar sakte hain
  // Your code here
});
```

#### Example 4: Custom Roles
```typescript
// app/api/admin/reports/route.ts
import { requireRoles } from '@/lib/auth';

export const GET = requireRoles(['admin', 'editor'], async (request: NextRequest) => {
  // Sirf Admin aur Editor yahan access kar sakte hain
  // Your code here
});
```

### 4. Helper Functions Usage

```typescript
import { 
  isAdmin, 
  isEditor, 
  isOperator, 
  hasRole, 
  hasPrivilegedAccess,
  canEdit,
  canDelete,
  getRoleDisplayName,
  getRoleBadgeColor
} from '@/lib/utils/roleHelpers';

// Check specific role
if (isAdmin(user)) {
  // Admin specific code
}

// Check multiple roles
if (hasRole(user, ['admin', 'editor'])) {
  // Admin or Editor specific code
}

// Check if user has any privileged access
if (hasPrivilegedAccess(user)) {
  // Admin, Editor, or Operator specific code
}

// Check edit permission
if (canEdit(user)) {
  // Show edit button
}

// Check delete permission
if (canDelete(user)) {
  // Show delete button
}

// Get role display name
const roleName = getRoleDisplayName(user.role); // "Administrator", "Editor", etc.

// Get role badge color class
const badgeClass = getRoleBadgeColor(user.role); // "bg-red-100 text-red-800", etc.
```

## Complete Example: Protected Admin Page

```tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';
import { canEdit, canDelete, getRoleDisplayName, getRoleBadgeColor } from '@/lib/utils/roleHelpers';

export default function AdminShopsPage() {
  const { user } = useAuth();

  return (
    <RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Shops Management</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(user?.role || '')}`}>
            {getRoleDisplayName(user?.role || '')}
          </span>
        </div>

        {/* Edit button - Admin aur Editor ke liye */}
        {canEdit(user) && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Edit Shop
          </button>
        )}

        {/* Delete button - Sirf Admin ke liye */}
        {canDelete(user) && (
          <button className="bg-red-600 text-white px-4 py-2 rounded">
            Delete Shop
          </button>
        )}

        {/* Operator ke liye sirf view */}
        {user?.role === 'operator' && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-yellow-800">
              You are in view-only mode. Contact an admin for edit permissions.
            </p>
          </div>
        )}

        {/* Your shops list content */}
      </div>
    </RoleBasedRouteGuard>
  );
}
```

## Summary

1. **Client-Side Protection**: `RoleBasedRouteGuard` component use karein
2. **Server-Side Protection**: `requireAdmin`, `requireAdminOnly`, `requireEditor`, ya `requireRoles` use karein
3. **Conditional Rendering**: Helper functions use karein (`canEdit`, `canDelete`, `hasRole`, etc.)
4. **Role Display**: `getRoleDisplayName` aur `getRoleBadgeColor` use karein

## Important Notes

- **Always protect both client and server side**
- **Client-side protection is for UX only** - real security server-side honi chahiye
- **API routes mein hamesha server-side protection use karein**
- **User role JWT token mein store hota hai**

## Testing

1. Different roles ke saath login karke test karein
2. Unauthorized access attempt karke check karein
3. Conditional rendering properly kaam kar raha hai ya nahi verify karein












