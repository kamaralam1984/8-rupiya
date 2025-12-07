# 🌐 Domain se Website Link Karne Ka Complete Guide

## 📋 Overview
Aapki Next.js website ko custom domain se link karne ke liye yeh steps follow karein.

---

## 🎯 Method 1: Vercel (Recommended - Sabse Aasaan)

Vercel Next.js ke liye best hosting platform hai. Free tier bhi available hai.

### Step 1: Vercel Account Banayein
1. [Vercel.com](https://vercel.com) par jayein
2. "Sign Up" par click karein
3. GitHub, GitLab, ya Bitbucket se account connect karein

### Step 2: Project Deploy Karein
1. Vercel dashboard me "Add New Project" par click karein
2. Aapki GitHub repository select karein
3. Project settings:
   - **Framework Preset**: Next.js (auto-detect hoga)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
   - **Install Command**: `npm install` (auto)

4. **Environment Variables** add karein:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   ```

5. "Deploy" button par click karein
6. 2-3 minutes me website deploy ho jayegi
7. Aapko ek URL milega: `your-project.vercel.app`

### Step 3: Domain Add Karein
1. Vercel dashboard me aapke project par click karein
2. "Settings" tab par jayein
3. "Domains" section me jayein
4. Aapka domain name enter karein (e.g., `example.com`)
5. "Add" par click karein

### Step 4: DNS Configuration
Vercel aapko DNS records dega. Aapko apne domain provider (GoDaddy, Namecheap, etc.) me yeh add karne honge:

#### Option A: Root Domain (example.com)
```
Type: A
Name: @
Value: 76.76.21.21
```

#### Option B: WWW Subdomain (www.example.com)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Important**: 
- DNS changes ko propagate hone me 24-48 hours lag sakte hain
- Vercel automatically SSL certificate provide karta hai (HTTPS)

---

## 🎯 Method 2: Other Hosting Options

### Option A: Netlify
1. [Netlify.com](https://netlify.com) par account banayein
2. GitHub se project connect karein
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Domain add karein aur DNS configure karein

### Option B: AWS / DigitalOcean / VPS
Agar aap VPS use karna chahte hain:

1. **Server Setup**:
   ```bash
   # Node.js install karein
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2 install karein (process manager)
   sudo npm install -g pm2
   ```

2. **Project Deploy**:
   ```bash
   # Git se clone karein
   git clone your-repo-url
   cd your-project
   
   # Dependencies install
   npm install
   
   # Build
   npm run build
   
   # Start with PM2
   pm2 start npm --name "your-app" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Setup** (Reverse Proxy):
   ```bash
   sudo apt install nginx
   ```

   `/etc/nginx/sites-available/your-domain` file banayein:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **SSL Certificate** (Let's Encrypt):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

5. **DNS Configuration**:
   ```
   Type: A
   Name: @
   Value: your-server-ip-address
   
   Type: A
   Name: www
   Value: your-server-ip-address
   ```

---

## 🔧 Pre-Deployment Checklist

### 1. Environment Variables Check Karein
`.env.local` file me yeh variables honi chahiye:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 2. Build Test Karein
```bash
npm run build
```
Agar build successful hai, to production ready hai.

### 3. MongoDB Atlas Configuration
- MongoDB Atlas me aapke server ka IP whitelist karein
- Vercel ke liye: "Allow access from anywhere" (0.0.0.0/0)
- VPS ke liye: Aapke server ka IP add karein

### 4. CORS Settings (Agar zarurat ho)
`next.config.ts` me check karein ki CORS properly configured hai.

---

## 📝 Domain Purchase Guide

### Popular Domain Providers:
1. **GoDaddy** - https://godaddy.com
2. **Namecheap** - https://namecheap.com
3. **Google Domains** - https://domains.google
4. **Cloudflare** - https://cloudflare.com/products/registrar

### Domain Kharidne Ke Steps:
1. Domain provider par account banayein
2. Desired domain name search karein
3. Available domain select karein
4. Purchase karein (₹500-2000/year typically)
5. Domain management panel me DNS settings configure karein

---

## 🔍 DNS Records Explained

### A Record
- **Use**: Root domain (example.com) ke liye
- **Value**: Server IP address
- **TTL**: 3600 (1 hour) recommended

### CNAME Record
- **Use**: Subdomains (www.example.com) ke liye
- **Value**: Target domain (cname.vercel-dns.com)
- **TTL**: 3600

### MX Record (Email ke liye - Optional)
- Agar custom email chahiye (info@yourdomain.com)
- Google Workspace ya Zoho use kar sakte hain

---

## ✅ Post-Deployment Steps

### 1. Website Test Karein
- Homepage check karein
- All pages test karein
- Admin panel login test karein
- Forms aur APIs test karein

### 2. SSL Certificate Verify
- HTTPS properly kaam kar raha hai ya nahi
- Browser me padlock icon check karein

### 3. Performance Check
- Google PageSpeed Insights use karein
- Lighthouse score check karein

### 4. SEO Setup
- Google Search Console me domain add karein
- Sitemap submit karein
- robots.txt verify karein

---

## 🚨 Common Issues aur Solutions

### Issue 1: DNS Not Working
**Solution**: 
- DNS propagation check karein: https://dnschecker.org
- 24-48 hours wait karein
- DNS cache clear karein

### Issue 2: SSL Certificate Error
**Solution**:
- Vercel automatically SSL provide karta hai
- VPS me Let's Encrypt renew karein: `sudo certbot renew`

### Issue 3: Build Errors
**Solution**:
- Environment variables check karein
- `npm run build` locally test karein
- Vercel build logs check karein

### Issue 4: MongoDB Connection Failed
**Solution**:
- MongoDB Atlas me IP whitelist check karein
- Connection string verify karein
- Network access settings check karein

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **DNS Help**: Aapke domain provider ka support

---

## 🎉 Final Steps

1. ✅ Domain purchase kiya
2. ✅ Website deploy kiya (Vercel/Netlify/VPS)
3. ✅ DNS records configure kiye
4. ✅ SSL certificate active hai
5. ✅ Website test kiya
6. ✅ Google Search Console me add kiya

**Congratulations! 🎊 Aapki website ab live hai!**

---

## 💡 Pro Tips

1. **CDN Use Karein**: Vercel automatically CDN provide karta hai
2. **Caching**: Next.js automatic caching karta hai
3. **Monitoring**: Vercel Analytics use karein
4. **Backup**: Regular database backups lete rahein
5. **Updates**: Regularly dependencies update karein

---

**Note**: Agar koi specific issue aaye, to detailed error message share karein, main help karunga!

