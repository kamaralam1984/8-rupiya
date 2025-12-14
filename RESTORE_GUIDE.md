# 🔄 Database Restore Guide

## Overview
Database restore functionality allows you to restore your database to a specific point in time by deleting all data created after that time.

## ⚠️ Important Warnings

1. **This is a destructive operation** - Data deleted cannot be recovered
2. **Always preview before restoring** - Use the preview feature to see what will be deleted
3. **Make backups** - Ensure you have a backup before performing restore
4. **Admin only** - Only admin users can access this feature

## How to Use

### Step 1: Access Restore Page
1. Login as admin
2. Navigate to **Admin Panel** → **Restore** (in sidebar)

### Step 2: Set Restore Point
1. Select the **Restore Date** (e.g., 13/12/2025)
2. Select the **Restore Time** (e.g., 11:30 AM)
3. The restore point will be: **13/12/2025 at 11:30 AM**

### Step 3: Preview Changes
1. Click **"🔍 Preview Changes"** button
2. Review what will be deleted:
   - Number of shops to delete
   - Number of agent shops to delete
   - Number of renewal payments to delete
   - Number of modified shops
3. Check the sample list of shops that will be deleted

### Step 4: Execute Restore
1. If preview looks correct, click **"⚠️ Execute Restore"** button
2. Confirm the warning dialog (appears twice for safety)
3. Wait for the restore to complete
4. You'll see a success message with the number of records deleted

## What Gets Deleted

The restore operation deletes all records **created after** the restore point:

1. **Shops** (`shopsfromimage` collection)
   - All shops created after the restore date/time

2. **Agent Shops** (`agentshops` collection)
   - All agent-created shops created after the restore date/time

3. **Renewal Payments** (`renewalpayments` collection)
   - All renewal payment records created after the restore date/time

4. **Renew Shops** (`renewshops` collection)
   - All expired shops moved to renew collection after the restore date/time

## What Happens After Restore

1. **Agent Earnings Recalculated**
   - All agent earnings are automatically recalculated based on remaining paid shops
   - Ensures accuracy after deletion

2. **Modified Shops**
   - Shops created **before** the restore point but modified **after** will remain
   - Only shops **created** after the restore point are deleted

## Example Usage

### Scenario: Restore to 13/12/2025 11:30 AM

1. **Date**: 13/12/2025
2. **Time**: 11:30
3. **Result**: 
   - All shops created after 13/12/2025 11:30 AM will be deleted
   - All agent shops created after 13/12/2025 11:30 AM will be deleted
   - All renewal payments created after 13/12/2025 11:30 AM will be deleted
   - Database will be restored to the state it was at 13/12/2025 11:30 AM

## API Endpoints

### Preview Restore
```
POST /api/admin/restore/preview
Body: { "restoreDateTime": "2025-12-13T11:30:00" }
```

### Execute Restore
```
POST /api/admin/restore
Body: { "restoreDateTime": "2025-12-13T11:30:00" }
```

## Safety Features

1. **Double Confirmation** - Requires two confirmations before executing
2. **Preview First** - Must preview before executing
3. **Admin Only** - Only admin role can access
4. **Detailed Logging** - All operations are logged

## Notes

- The restore is based on `createdAt` timestamp
- Shops modified after restore point but created before will remain
- Agent earnings are automatically recalculated
- This operation cannot be undone - always backup first!

## Troubleshooting

### Error: "Invalid date/time format"
- Ensure date is in YYYY-MM-DD format
- Ensure time is in HH:MM format (24-hour)

### Error: "Access Denied"
- Only admin users can access restore functionality
- Check your user role

### No data deleted
- Check if any data was actually created after the restore point
- Verify the restore date/time is correct


