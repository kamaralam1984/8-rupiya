# Agent Panel Text Feature

## Overview
Is feature se admin agents ke liye custom text message set kar sakte hain jo agent panel (dashboard aur shops page) mein display hoga. Text ka color bhi select kar sakte hain: Red, Green, Blue, ya Black.

## Features

### 1. **Admin Side - Agent Create/Edit Form**
- **Location**: `/admin/agents/new` aur `/admin/agents/[id]/edit`
- **Fields**:
  - **Agent Panel Text**: Textarea field jismein message likh sakte hain
  - **Text Color**: 4 color options (Red, Green, Blue, Black)

### 2. **Agent Side - Display**
- **Dashboard**: `/agent/dashboard` - Welcome card mein text display hota hai
- **Shops Page**: `/agent/shops` - Header ke neeche prominent card mein display hota hai

## How to Use

### Step 1: Admin Panel se Agent Create/Edit Karein

1. `/admin/agents/new` ya `/admin/agents/[id]/edit` par jayein
2. "Agent Panel Text" field mein message likhein
3. Color button se color select karein:
   - 🔴 **Red** - Important messages ke liye
   - 🟢 **Green** - Success/positive messages ke liye
   - 🔵 **Blue** - Information messages ke liye
   - ⚫ **Black** - Default/neutral messages ke liye
4. Form submit karein

### Step 2: Agent Panel mein Display

Agent login karke:
- **Dashboard** (`/agent/dashboard`) par welcome card mein text dikhega
- **Shops Page** (`/agent/shops`) par header ke neeche card mein text dikhega

## Color Options

| Color | Use Case | Hex Code |
|-------|----------|----------|
| 🔴 Red | Important alerts, warnings | #ef4444 |
| 🟢 Green | Success messages, positive info | #22c55e |
| 🔵 Blue | General information | #3b82f6 |
| ⚫ Black | Default, neutral messages | #000000 |

## Example Messages

### Red (Important):
- "⚠️ Payment pending for 3 shops. Please collect payment immediately."
- "🚨 Urgent: Contact admin for shop verification."

### Green (Success):
- "✅ Great job! You've added 10 shops this month."
- "🎉 Congratulations! You've reached your monthly target."

### Blue (Information):
- "ℹ️ New features added to agent panel. Check dashboard for updates."
- "📢 Important announcement: New payment method available."

### Black (Default):
- "Welcome to Digital India Agent Panel"
- "Please ensure all shop details are accurate before submission."

## Technical Details

### Database Fields
- `agentPanelText`: String (max 500 characters)
- `agentPanelTextColor`: Enum ('red', 'green', 'blue', 'black')

### API Endpoints
- `GET /api/agent/dashboard` - Returns agent panel text
- `POST /api/admin/agents` - Creates agent with panel text
- `PUT /api/admin/agents/[id]` - Updates agent panel text

### Components
- `AgentPanelTextDisplay` - Reusable component for displaying panel text
- Used in:
  - `/agent/dashboard/page.tsx`
  - `/agent/shops/page.tsx`

## Display Locations

### 1. Agent Dashboard
```
┌─────────────────────────────────┐
│ Welcome Card                    │
│ Welcome, Agent Name             │
│ Agent ID: AG001                 │
│ ─────────────────────────────   │
│ [Agent Panel Text in Color]     │ ← Yahan display hota hai
└─────────────────────────────────┘
```

### 2. Agent Shops Page
```
┌─────────────────────────────────┐
│ Header: My Shops                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Agent Panel Text Card]         │ ← Yahan display hota hai
│ (with colored border & text)    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Filters & Shops List            │
└─────────────────────────────────┘
```

## Best Practices

1. **Keep messages short** - Max 2-3 lines recommended
2. **Use appropriate colors**:
   - Red for urgent/important
   - Green for positive/success
   - Blue for general info
   - Black for neutral/default
3. **Update regularly** - Keep messages relevant and current
4. **Clear communication** - Use simple, clear language

## Troubleshooting

### Text Nahi Dikha Raha?
1. Check karein ki agent ke profile mein `agentPanelText` set hai ya nahi
2. Browser console mein errors check karein
3. API response check karein (`/api/agent/dashboard`)

### Color Nahi Apply Ho Raha?
1. Verify karein ki `agentPanelTextColor` properly set hai
2. Color value 'red', 'green', 'blue', ya 'black' honi chahiye
3. Browser cache clear karein

## Future Enhancements

- Rich text formatting support
- Multiple messages with different colors
- Scheduled messages (show/hide based on date)
- Message templates
- Image support in messages












