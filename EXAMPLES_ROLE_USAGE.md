# Role-Based Access Control - Practical Examples

## Quick Start Examples

### 1. Page ko Protect Karna (Client-Side)

```tsx
// app/(admin)/admin/shops/page.tsx
'use client';

import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';
import { useAuth } from '@/app/contexts/AuthContext';
import { canEdit, canDelete } from '@/lib/utils/roleHelpers';

export default function ShopsPage() {
  const { user } = useAuth();

  return (
    <RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
      <div className="p-6">
        <h1>Shops Management</h1>
        
        {/* Edit button - Admin aur Editor */}
        {canEdit(user) && (
          <button>Edit Shop</button>
        )}
        
        {/* Delete button - Sirf Admin */}
        {canDelete(user) && (
          <button>Delete Shop</button>
        )}
      </div>
    </RoleBasedRouteGuard>
  );
}
```

### 2. API Route ko Protect Karna (Server-Side)

```typescript
// app/api/admin/shops/route.ts
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Admin, Editor, ya Operator ko access
export const GET = requireAdmin(async (request: NextRequest) => {
  // Your code
  return NextResponse.json({ success: true });
});

// Sirf Admin ko access
import { requireAdminOnly } from '@/lib/auth';
export const DELETE = requireAdminOnly(async (request: NextRequest) => {
  // Your code
  return NextResponse.json({ success: true });
});
```

### 3. Conditional UI Elements

```tsx
import { useAuth } from '@/app/contexts/AuthContext';
import { hasRole, canEdit, canDelete } from '@/lib/utils/roleHelpers';

function ShopCard({ shop }) {
  const { user } = useAuth();

  return (
    <div>
      <h3>{shop.name}</h3>
      
      {/* Admin aur Editor ko edit button */}
      {canEdit(user) && (
        <button onClick={() => editShop(shop.id)}>Edit</button>
      )}
      
      {/* Sirf Admin ko delete button */}
      {canDelete(user) && (
        <button onClick={() => deleteShop(shop.id)}>Delete</button>
      )}
      
      {/* Operator ko sirf view message */}
      {hasRole(user, ['operator']) && (
        <p className="text-gray-500">View Only</p>
      )}
    </div>
  );
}
```

## Common Use Cases

### Use Case 1: Admin Panel - Sab ko access
```tsx
<RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
  <AdminPanel />
</RoleBasedRouteGuard>
```

### Use Case 2: Settings Page - Sirf Admin
```tsx
<RoleBasedRouteGuard allowedRoles={['admin']}>
  <SettingsPage />
</RoleBasedRouteGuard>
```

### Use Case 3: Edit Forms - Admin aur Editor
```tsx
<RoleBasedRouteGuard allowedRoles={['admin', 'editor']}>
  <EditForm />
</RoleBasedRouteGuard>
```

## API Route Examples

### Example 1: GET - Sab privileged users ko
```typescript
export const GET = requireAdmin(async (request: NextRequest) => {
  // Admin, Editor, Operator - sab access kar sakte hain
});
```

### Example 2: POST/PUT - Admin aur Editor ko
```typescript
export const POST = requireEditor(async (request: NextRequest) => {
  // Admin aur Editor access kar sakte hain
});
```

### Example 3: DELETE - Sirf Admin ko
```typescript
export const DELETE = requireAdminOnly(async (request: NextRequest) => {
  // Sirf Admin access kar sakta hai
});
```

### Example 4: Custom Roles
```typescript
export const GET = requireRoles(['admin', 'editor'], async (request: NextRequest) => {
  // Sirf Admin aur Editor
});
```

## Helper Functions

```typescript
import { 
  isAdmin,           // Check if admin
  isEditor,          // Check if editor
  isOperator,        // Check if operator
  hasRole,           // Check multiple roles
  hasPrivilegedAccess, // Check if admin/editor/operator
  canEdit,           // Check if can edit (admin/editor)
  canDelete,         // Check if can delete (admin only)
  getRoleDisplayName, // Get role name
  getRoleBadgeColor   // Get badge color class
} from '@/lib/utils/roleHelpers';
```

## Complete Example

```tsx
'use client';

import RoleBasedRouteGuard from '@/app/components/RoleBasedRouteGuard';
import { useAuth } from '@/app/contexts/AuthContext';
import { canEdit, canDelete, getRoleDisplayName, getRoleBadgeColor } from '@/lib/utils/roleHelpers';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <RoleBasedRouteGuard allowedRoles={['admin', 'editor', 'operator']}>
      <div className="p-6">
        {/* Role Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(user?.role || '')}`}>
            {getRoleDisplayName(user?.role || '')}
          </span>
        </div>

        {/* Actions based on role */}
        <div className="flex gap-4">
          {canEdit(user) && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Create New
            </button>
          )}
          
          {canDelete(user) && (
            <button className="bg-red-600 text-white px-4 py-2 rounded">
              Delete Selected
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-6">
          {/* Your content here */}
        </div>
      </div>
    </RoleBasedRouteGuard>
  );
}
```










