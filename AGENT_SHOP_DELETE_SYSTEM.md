# Agent Shop Delete System

## Overview

Agent ke dwara banaye gaye shops ko delete karne ka complete system implement kiya gaya hai. Jab shop delete hota hai, to automatically:
- Agent ka commission deduct hota hai
- Revenue se plan payment amount deduct hota hai
- Shop sabhi collections se delete hota hai
- Agent ka totalShops count update hota hai

## Features Implemented

### 1. Shop Deletion with Commission & Revenue Deduction

**File: `app/api/admin/shops/[id]/route.ts` (DELETE endpoint)**

#### Process Flow:

1. **Find Shop:**
   - AdminShop collection mein search karein
   - Agar nahi mila, to old Shop model mein search karein

2. **Find AgentShop:**
   - Multiple strategies use karke AgentShop find karein:
     - Strategy 1: `createdByAdmin` check karein (agar agent ID hai)
     - Strategy 2: Shop name, owner name, aur mobile se match
     - Strategy 3: Shop name aur owner name se match
     - Strategy 4: Sirf shop name se match

3. **If Shop is PAID:**
   - **Agent Commission Deduction:**
     - AgentShop se commission amount get karein
     - Agent ke `totalEarnings` se commission deduct karein
     - Agent ke `totalShops` count se 1 subtract karein
     - Agent record update karein
   
   - **Revenue Deduction:**
     - Payment date aur district ke based revenue record find karein
     - Plan type ke according revenue deduct karein:
       - Plan-specific revenue (basicPlanRevenue, premiumPlanRevenue, etc.)
       - Plan count (-1)
       - Total revenue deduct
       - Agent commission deduct
       - Net revenue recalculate

4. **Delete from All Collections:**
   - AdminShop collection se delete
   - Shop collection se delete (old model)
   - AgentShop collection se delete

### 2. Enhanced UI Feedback

**File: `app/(admin)/admin/shops/page.tsx`**

- **Confirmation Dialogs:**
  - First confirmation: Basic warning
  - Second confirmation: Paid shops ke liye detailed warning
  - Clear explanation of deductions

- **Success Messages:**
  - Commission deduction amount
  - Revenue deduction amount
  - Agent name aur code
  - Detailed toast notifications

- **Visual Indicators:**
  - Delete button tooltip (paid shops ke liye warning)
  - Loading states
  - Error handling

## API Endpoint

### DELETE /api/admin/shops/[id]

**Request:**
```http
DELETE /api/admin/shops/[id]
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Shop deleted successfully. Deducted ₹20 from agent commission and ₹100 from revenue.",
  "deductions": {
    "commissionDeducted": 20,
    "revenueDeducted": 100,
    "agentName": "Agent Name",
    "agentCode": "AG001"
  }
}
```

**Response (Pending Shop):**
```json
{
  "success": true,
  "message": "Shop deleted successfully",
  "deductions": {
    "commissionDeducted": 0,
    "revenueDeducted": 0,
    "agentName": null,
    "agentCode": null
  }
}
```

## Deduction Logic

### Commission Deduction

1. **Calculate Commission:**
   - AgentShop se `agentCommission` field use karein
   - Ya `calculateAgentCommission(planType, planAmount)` se calculate karein

2. **Deduct from Agent:**
   - Agent ke `totalEarnings` se commission subtract
   - Agent ke `totalShops` se 1 subtract
   - Minimum 0 ensure karein (negative nahi hona chahiye)

### Revenue Deduction

1. **Find Revenue Record:**
   - Payment date (lastPaymentDate ya createdAt)
   - District name
   - Revenue record find/update karein

2. **Deduct Plan Revenue:**
   - Plan type ke according:
     - `basicPlanRevenue` - ₹100
     - `premiumPlanRevenue` - ₹2999
     - `featuredPlanRevenue` - Variable
     - `leftBarPlanRevenue` - ₹3588
     - `rightBarPlanRevenue` - ₹3588
     - `bannerPlanRevenue` - ₹4788
     - `heroPlanRevenue` - ₹5988

3. **Update Totals:**
   - `totalRevenue` deduct
   - `totalAgentCommission` deduct
   - `netRevenue` recalculate
   - Plan count (-1)

## Shop Matching Strategies

### Strategy 1: createdByAdmin Check
```typescript
if (shop.createdByAdmin) {
  const possibleAgent = await Agent.findById(shop.createdByAdmin);
  if (possibleAgent) {
    agentShop = await AgentShop.findOne({
      agentId: shop.createdByAdmin,
      shopName: shopName,
      ownerName: ownerName,
    });
  }
}
```

### Strategy 2: Exact Match (Name + Owner + Mobile)
```typescript
agentShop = await AgentShop.findOne({
  shopName: shopName,
  ownerName: ownerName,
  mobile: shopMobile,
});
```

### Strategy 3: Name + Owner Match
```typescript
agentShop = await AgentShop.findOne({
  shopName: shopName,
  ownerName: ownerName,
});
```

### Strategy 4: Name Only Match
```typescript
agentShop = await AgentShop.findOne({
  shopName: shopName,
});
```

## Collections Deleted From

1. ✅ **AdminShop** (shopsfromimage collection)
2. ✅ **Shop** (old shops collection)
3. ✅ **AgentShop** (agentshops collection)

## Safety Features

### Error Handling:
- Commission deduction fail ho to bhi shop delete hoga
- Revenue deduction fail ho to bhi shop delete hoga
- AgentShop matching fail ho to bhi shop delete hoga
- Detailed error logging

### Validation:
- Agent earnings check (negative nahi hona chahiye)
- Revenue record existence check
- Shop existence check

## Example Scenarios

### Scenario 1: Delete Paid Shop (Basic Plan)
```
Shop: "ABC Store"
Plan: BASIC (₹100)
Agent: "John Doe" (AG001)
Commission: ₹20

Actions:
1. Deduct ₹20 from agent.totalEarnings
2. Deduct 1 from agent.totalShops
3. Deduct ₹100 from revenue.basicPlanRevenue
4. Deduct ₹20 from revenue.totalAgentCommission
5. Recalculate revenue.netRevenue
6. Delete from AdminShop, Shop, AgentShop
```

### Scenario 2: Delete Pending Shop
```
Shop: "XYZ Store"
Plan: BASIC (₹100)
Status: PENDING

Actions:
1. No commission deduction (not paid)
2. No revenue deduction (not paid)
3. Delete from AdminShop, Shop, AgentShop
```

## Files Modified

1. ✅ `app/api/admin/shops/[id]/route.ts` - Delete endpoint with deductions
2. ✅ `app/(admin)/admin/shops/page.tsx` - Enhanced delete UI

## Testing

### Test Cases:

1. **Delete Paid Shop:**
   - ✅ Shop delete hona chahiye
   - ✅ Agent commission deduct hona chahiye
   - ✅ Revenue deduct hona chahiye
   - ✅ Agent totalShops update hona chahiye

2. **Delete Pending Shop:**
   - ✅ Shop delete hona chahiye
   - ✅ No commission deduction
   - ✅ No revenue deduction

3. **Delete Shop without AgentShop:**
   - ✅ Shop delete hona chahiye
   - ✅ No errors

4. **Error Handling:**
   - ✅ Commission deduction fail ho to shop delete hoga
   - ✅ Revenue deduction fail ho to shop delete hoga

## Important Notes

⚠️ **Warning:**
- Shop deletion permanent hai
- Commission aur revenue deduction automatic hai
- AgentShop bhi delete hota hai (history maintain nahi hoti)

✅ **Benefits:**
- Complete cleanup (sabhi collections se delete)
- Accurate commission tracking
- Accurate revenue tracking
- Agent stats automatically update

## Future Improvements

- Soft delete option (archive instead of delete)
- Delete history/audit log
- Bulk delete with batch processing
- Undo delete functionality (with time limit)








