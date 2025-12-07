# 🚀 Agent Panel - Quick Start Guide

## तुरंत Start करने के लिए:

### 1️⃣ Server Start करें
```bash
npm run dev
```
Wait करें जब तक server start न हो जाए (http://localhost:3000)

### 2️⃣ Agent Account बनाएं
**नया Terminal window खोलें** और run करें:
```bash
npm run create-agent
```

या:
```bash
npx ts-node scripts/create-agent.ts
```

### 3️⃣ Browser में खोलें
Browser में यह URL open करें:
```
http://localhost:3000/agent/login
```

### 4️⃣ Login करें
- **Email/Phone**: `rahul@digitalindia.com` या `+919876543210`
- **Password**: `password123`
- **Login** button click करें

---

## ✅ Login Credentials (Default)

```
📧 Email:    rahul@digitalindia.com
📱 Phone:    +919876543210
🔒 Password: password123
🆔 Agent ID: AG001
```

---

## 📍 Important Links

- **Login Page**: http://localhost:3000/agent/login
- **Dashboard**: http://localhost:3000/agent/dashboard
- **Add Shop**: http://localhost:3000/agent/shops/new

---

## ❓ अगर Error आए:

### "ts-node not found"
```bash
npm install -D ts-node @types/node
```

### "Agent not found"
Script फिर से run करें:
```bash
npm run create-agent
```

### "MongoDB connection error"
`.env.local` file में `MONGODB_URI` check करें

---

**सब कुछ ready है! 🎉**


