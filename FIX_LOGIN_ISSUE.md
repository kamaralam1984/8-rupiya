# 🔧 Agent Login Issue Fix Guide

## Problem: "Invalid credentials" Error

अगर login नहीं हो रहा है, तो ये steps follow करें:

### Step 1: Agent Verify करें

Terminal में run करें:
```bash
npm run verify-agent
```

यह check करेगा कि agent database में है या नहीं।

### Step 2: Agent Create/Reset करें

अगर agent नहीं मिला या password issue है, तो run करें:
```bash
npm run reset-agent
```

यह script:
- Agent को create करेगा (अगर नहीं है)
- Password को reset करेगा (अगर agent already है)
- Password verification भी करेगा

### Step 3: Login Try करें

Browser में जाएं: http://localhost:3000/agent/login

**Credentials:**
- Email: `rahul@digitalindia.com`
- या Phone: `+919876543210`
- Password: `password123`

### Step 4: अगर अभी भी नहीं हो रहा

1. **Server restart करें:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Database connection check करें:**
   - `.env.local` file में `MONGODB_URI` correct है या नहीं
   - MongoDB Atlas में IP whitelist check करें

3. **Browser console check करें:**
   - Browser में F12 press करें
   - Console tab में errors देखें
   - Network tab में API request check करें

## 🔍 Debugging Commands

```bash
# Agent verify करें
npm run verify-agent

# Agent create/reset करें
npm run reset-agent

# Agent create करें (new)
npm run create-agent
```

## ✅ Expected Output

`verify-agent` run करने पर आपको यह दिखना चाहिए:

```
✅ Agent found!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Name:        Rahul Kumar
   Email:       rahul@digitalindia.com
   Phone:       +919876543210
   Agent Code:  AG001
   Password Hash: Set ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Password Test: ✅ PASSED
   Testing with: "password123"

✅ Agent is ready for login!
```

## 🚨 Common Issues

### Issue 1: "Agent NOT FOUND"
**Solution:** Run `npm run reset-agent`

### Issue 2: "Password Test: FAILED"
**Solution:** Run `npm run reset-agent` to reset password

### Issue 3: "MongoDB connection error"
**Solution:** 
- Check `.env.local` file
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist

### Issue 4: "ts-node not found"
**Solution:** 
```bash
npm install -D ts-node @types/node
```

---

**अगर अभी भी issue है, तो `npm run verify-agent` का output share करें!**

