# Sidebar Role-Based Menu Configuration

## Overview
Admin sidebar mein ab role-based menu items hain. Har menu item ke liye specify kiya gaya hai ki kaun se roles ko access milna chahiye.

## Current Configuration

### 1. **All Roles Access** (Admin, Editor, Operator)
Ye menu items sab ko dikhte hain:
- 📊 Dashboard
- 🏪 Businesses
- 🏬 Shops
- 💰 Revenue

### 2. **Admin & Editor Only**
Ye menu items sirf Admin aur Editor ko dikhte hain:
- 🏠 Homepage
- 🖼️ Banners
- 📁 Categories
- 📸 New Shop (Image)
- 🔄 Renew Shops
- 👤 Agents
- 📍 Locations
- 📄 Pages
- 🖼️ Location Images

### 3. **Admin Only**
Ye menu items sirf Admin ko dikhte hain:
- 👥 Users
- 🗄️ Database

## Kaise Configure Karein

### Menu Item Add/Modify Karna

`app/(admin)/admin/layout.tsx` file mein `navigation` array ko edit karein:

```typescript
const navigation = [
  {
    name: 'Menu Item Name',
    href: '/admin/route',
    icon: '📊',
    color: 'blue',
    allowedRoles: ['admin', 'editor', 'operator'] // Yahan roles specify karein
  },
];
```

### Role Options

1. **Sab ko access** (Admin, Editor, Operator):
   ```typescript
   allowedRoles: ['admin', 'editor', 'operator']
   ```

2. **Admin aur Editor ko access**:
   ```typescript
   allowedRoles: ['admin', 'editor']
   ```

3. **Sirf Admin ko access**:
   ```typescript
   allowedRoles: ['admin']
   ```

4. **Sirf Editor ko access**:
   ```typescript
   allowedRoles: ['editor']
   ```

5. **Sirf Operator ko access**:
   ```typescript
   allowedRoles: ['operator']
   ```

## Examples

### Example 1: Naya Menu Item Add Karna (Sab ko access)
```typescript
{
  name: 'Reports',
  href: '/admin/reports',
  icon: '📈',
  color: 'indigo',
  allowedRoles: ['admin', 'editor', 'operator']
}
```

### Example 2: Naya Menu Item (Sirf Admin aur Editor)
```typescript
{
  name: 'Settings',
  href: '/admin/settings',
  icon: '⚙️',
  color: 'gray',
  allowedRoles: ['admin', 'editor']
}
```

### Example 3: Naya Menu Item (Sirf Admin)
```typescript
{
  name: 'System Logs',
  href: '/admin/logs',
  icon: '📋',
  color: 'red',
  allowedRoles: ['admin']
}
```

## Role Badge Display

Sidebar footer mein user ka role badge automatically display hota hai:
- 👑 **Administrator** (Red badge) - Admin role
- ✏️ **Editor** (Blue badge) - Editor role
- 👁️ **Operator** (Green badge) - Operator role

## Important Notes

1. **Menu items automatically filter hote hain** - user ke role ke basis par
2. **Role check client-side hota hai** - lekin API routes mein bhi server-side protection honi chahiye
3. **Navigation array mein `allowedRoles` property required hai** - agar nahi diya to default mein sab ko access milega
4. **User role JWT token se aata hai** - jo login time set hota hai

## Testing

1. **Admin role se login karke** - sab menu items dikhne chahiye
2. **Editor role se login karke** - admin-only items nahi dikhne chahiye
3. **Operator role se login karke** - sirf view-only items dikhne chahiye

## Current Menu Structure

```
📊 Dashboard (All)
👥 Users (Admin Only)
🏠 Homepage (Admin + Editor)
🖼️ Banners (Admin + Editor)
📁 Categories (Admin + Editor)
🏪 Businesses (All)
🏬 Shops (All)
📸 New Shop (Image) (Admin + Editor)
🔄 Renew Shops (Admin + Editor)
👤 Agents (Admin + Editor)
💰 Revenue (All)
🗄️ Database (Admin Only)
📍 Locations (Admin + Editor)
📄 Pages (Admin + Editor)
🖼️ Location Images (Admin + Editor)
```

## Troubleshooting

### Menu Item Nahi Dikha Raha?
1. Check karein ki `allowedRoles` array mein user ka role hai ya nahi
2. Browser console mein errors check karein
3. User role properly set hai ya nahi verify karein

### Role Badge Nahi Dikha Raha?
1. User object mein `role` property check karein
2. Role value 'admin', 'editor', ya 'operator' honi chahiye

## Future Enhancements

- Menu items ko database se load karna
- Dynamic menu permissions
- Role-based sub-menus
- Menu item visibility based on permissions










