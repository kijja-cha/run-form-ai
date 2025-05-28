# 🚀 RunForm.AI - Deployment Guide

## 🌐 Vercel Deployment (แนะนำ)

### 🎯 ทำไมเลือก Vercel:
- ✅ **HTTPS automatic** - แก้ปัญหา security warning
- ✅ **Global CDN** - เร็วทั่วโลก  
- ✅ **Zero-config** - Deploy ง่าย
- ✅ **GitHub integration** - Auto-deploy
- ✅ **Custom domains** - ใช้ domain เอง
- ✅ **Free tier** - เพียงพอสำหรับ POC

### 📋 Quick Deploy Steps:

#### วิธีที่ 1: GitHub Integration (แนะนำ)
1. **Push to GitHub:**
   ```bash
   git add vercel.json DEPLOY.md
   git commit -m "feat: Add Vercel deployment config"
   git push origin main
   ```

2. **Connect to Vercel:**
   - ไป [vercel.com](https://vercel.com)
   - Sign up ด้วย GitHub account
   - คลิก "New Project"
   - เลือก `runform-ai` repository
   - คลิก "Deploy"

3. **Done!** 🎉
   - URL: `https://runform-ai-[random].vercel.app`
   - Auto-deploy ทุกครั้งที่ push

#### วิธีที่ 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy "~/runform-ai"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? runform-ai
# ? In which directory is your code located? ./
```

### ⚙️ Vercel Configuration

ไฟล์ `vercel.json` ที่เราสร้างมีฟีเจอร์:

```json
{
  "version": 2,
  "name": "runform-ai",
  "routes": [
    { "src": "/", "dest": "/index.html" },
    { "src": "/test", "dest": "/test.html" }
  ],
  "headers": [
    // CORS, Security Headers, CSP
  ]
}
```

### 🔧 Custom Domain (Optional)
1. ไป Vercel Dashboard
2. เลือก project → Settings → Domains
3. เพิ่ม domain ของคุณ
4. ตั้งค่า DNS records ตามที่แสดง

---

## 🌟 Alternative Deployment Options

### 1. **Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir .
```

**Netlify Features:**
- ✅ Form handling
- ✅ Edge functions  
- ✅ Split testing
- ✅ Analytics

### 2. **GitHub Pages**
```bash
# Enable GitHub Pages
# Settings → Pages → Source: Deploy from branch
# Branch: main / root
```

**GitHub Pages URL:**
`https://[username].github.io/runform-ai`

### 3. **Firebase Hosting**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

### 4. **Surge.sh**
```bash
# Install Surge
npm install -g surge

# Deploy
surge . runform-ai.surge.sh
```

---

## 📊 Deployment Comparison

| Platform | HTTPS | CDN | Custom Domain | Auto-Deploy | Free Tier |
|----------|-------|-----|---------------|-------------|-----------|
| **Vercel** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Netlify | ✅ | ✅ | ✅ | ✅ | ✅ |
| GitHub Pages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firebase | ✅ | ✅ | ✅ | ❌ | ✅ |
| Surge | ✅ | ❌ | ✅ | ❌ | ✅ |

---

## 🔒 Production Considerations

### Security Headers (ใน vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Performance Optimization:
- ✅ **Static assets caching** - CSS/JS cached 1 year
- ✅ **HTML no-cache** - Always fresh content
- ✅ **CDN distribution** - Global edge locations
- ✅ **Gzip compression** - Automatic

### Analytics (Optional):
```html
<!-- Add to index.html before </head> -->
<script defer data-domain="runform-ai.vercel.app" src="https://plausible.io/js/script.js"></script>
```

---

## 🚀 Post-Deployment Checklist

### ✅ **Functionality Tests:**
- [ ] Camera access works
- [ ] Video upload works  
- [ ] MediaPipe loads correctly
- [ ] Pose analysis functions
- [ ] Export feature works
- [ ] Mobile responsive

### ✅ **Performance Tests:**
- [ ] Page load < 3 seconds
- [ ] MediaPipe loads < 5 seconds
- [ ] Analysis completes successfully
- [ ] No console errors

### ✅ **Cross-Browser Tests:**
- [ ] Chrome (desktop/mobile)
- [ ] Firefox (desktop/mobile)
- [ ] Safari (desktop/mobile)
- [ ] Edge (desktop)

### ✅ **SEO & Sharing:**
- [ ] Meta tags correct
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Favicon loads

---

## 🎯 Recommended: Vercel Deployment

**คำแนะนำ:** ใช้ Vercel เพราะ:

1. **แก้ปัญหา HTTPS** - ไม่มี security warning
2. **Performance ดี** - Global CDN
3. **Setup ง่าย** - Connect GitHub แล้วเสร็จ
4. **Auto-deploy** - Push code แล้วอัปเดตเอง
5. **Free tier เพียงพอ** - สำหรับ POC และ production

### 🚀 Deploy Now:
```bash
# 1. Commit Vercel config
git add vercel.json DEPLOY.md
git commit -m "feat: Add Vercel deployment config"
git push origin main

# 2. Go to vercel.com
# 3. Connect GitHub
# 4. Deploy runform-ai
# 5. Done! 🎉
```

**Result:** `https://runform-ai-[random].vercel.app`

---

**🌟 Ready for global deployment!** 🚀 