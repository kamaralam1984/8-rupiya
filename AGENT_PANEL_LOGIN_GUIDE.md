# Agent Panel खोलने की Guide (How to Open Agent Panel)

## 📋 Step-by-Step Instructions

### Step 1: Development Server Start करें

Terminal में यह command run करें:
```bash
npm run dev
```

Server start होने के बाद आपको यह message दिखेगा:
```
▲ Next.js 16.0.2
- Local:        http://localhost:3000
```

### Step 2: Agent Account Create करें

**पहली बार use करने पर**, एक agent account create करना होगा:

#### Option 1: Script से (Recommended)
Terminal में (नया terminal open करें या background में run करें):
```bash
npx ts-node scripts/create-agent.ts
```

या package.json में script add करने के बाद:
```bash
npm run create-agent
```

#### Option 2: Direct Browser से
1. Browser में जाएं: http://localhost:3000/agent/login
2. अगर agent नहीं है तो contact admin करें

### Step 3: Login करें

1. Browser में जाएं: **http://localhost:3000/agent/login**

2. Login credentials enter करें:
   - **Email/Phone**: `rahul@digitalindia.com` या `+919876543210`
   - **Password**: `password123`

3. **Login** button click करें

### Step 4: Dashboard Access करें

Login successful होने के बाद automatically **Dashboard** page पर redirect हो जाएगा:
- URL: http://localhost:3000/agent/dashboard

## 🔑 Default Login Credentials

Script से create किए गए agent के लिए:

```
Email:    rahul@digitalindia.com
Phone:    +919876543210
Password: password123
Agent Code: AG001
```

## 📱 Important URLs

| Page | URL |
|------|-----|
| Login | http://localhost:3000/agent/login |
| Dashboard | http://localhost:3000/agent/dashboard |
| Add Shop | http://localhost:3000/agent/shops/new |
| My Shops | http://localhost:3000/agent/shops |
| Daily Report | http://localhost:3000/agent/reports/daily |
| Profile | http://localhost:3000/agent/profile |

## 🔧 Troubleshooting

### Problem: "Cannot find module ts-node"
**Solution**: Install करें:
```bash
npm install -D ts-node @types/node
```

### Problem: "MongoDB connection failed"
**Solution**: 
- `.env.local` file check करें
- `MONGODB_URI` correct है या नहीं verify करें

### Problem: "Agent not found" error
**Solution**: 
- Script run करके agent create करें:
```bash
npx ts-node scripts/create-agent.ts
```

### Problem: Server start नहीं हो रहा
**Solution**:
- Port 3000 already use हो रहा है तो किसी और port पर run करें:
```bash
PORT=3001 npm run dev
```

## 📝 Quick Start Commands

```bash
# 1. Server start करें
npm run dev

# 2. नया terminal में agent create करें
npx ts-node scripts/create-agent.ts

# 3. Browser में open करें
# http://localhost:3000/agent/login
```

## 🎯 Features Available

1. ✅ **Dashboard** - Stats और quick navigation
2. ✅ **Add New Shop** - 3-step form से shop register करें
3. ✅ **My Shops** - अपने सभी shops की list देखें
4. ✅ **Shop Details** - Individual shop की details
5. ✅ **Daily Report** - आज की report और earnings
6. ✅ **Profile** - Agent information और settings

## 💡 Tips

- Login करने के बाद browser में credentials save हो जाते हैं
- Logout करने के लिए Profile page में "Logout" button है
- Mobile device से भी access कर सकते हैं (same URL use करें)

---

**Happy Shopping! 🛒**

