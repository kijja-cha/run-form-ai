# 🚀 RunForm.AI - Local Server Guide

## 🏃‍♂️ Quick Start (เริ่มใช้งานเร็ว)

### 1. เริ่ม Server
```bash
# วิธีที่ 1: ใช้ npm
npm start

# วิธีที่ 2: รัน Node.js โดยตรง
node server.js

# วิธีที่ 3: เปลี่ยน port
node server.js --port 3001
```

### 2. เปิดใช้งาน
- **เครื่องเดียวกัน:** http://localhost:3000
- **มือถือ/เครื่องอื่น:** http://[YOUR_IP]:3000
- **หน้าทดสอบ:** http://localhost:3000/test.html

### 3. หยุด Server
กด `Ctrl + C` ใน terminal

---

## 🔒 แก้ปัญหา Security Warning

### Chrome - วิธีที่ 1 (แนะนำ):
```bash
# เปิด Chrome ด้วย flags สำหรับ development
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome_dev" --allow-running-insecure-content --disable-features=VizDisplayCompositor
```

### Chrome - วิธีที่ 2:
1. ไป `chrome://flags/`
2. ค้นหา "Insecure origins treated as secure"
3. เพิ่ม `http://localhost:3000,http://192.168.1.43:8080`
4. Restart Chrome

### Firefox:
1. ไป `about:config`
2. ค้นหา `security.mixed_content.block_active_content`
3. เปลี่ยนเป็น `false`
4. Restart Firefox

### Edge:
1. ไป `edge://flags/`
2. ค้นหา "Allow invalid certificates for resources loaded from localhost"
3. เปิดใช้งาน
4. Restart Edge

---

## 📱 Mobile Testing

### หา IP Address ของเครื่อง:

**Windows:**
```cmd
ipconfig
# หา IPv4 Address (เช่น 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig | grep inet
# หา inet address (เช่น 192.168.1.100)
```

### เชื่อมต่อจากมือถือ:
1. เครื่องคอมและมือถือต้องอยู่ WiFi เดียวกัน
2. เปิด browser บนมือถือ
3. ไป http://[IP_ADDRESS]:3000
4. ตัวอย่าง: http://192.168.1.100:3000
5. **กด "Advanced" → "Proceed to site"** ถ้ามี warning

---

## 🔧 Server Options

### Available Scripts:
```bash
npm start          # รัน server port 3000
npm run dev        # รัน development mode
npm run test       # รัน test server port 8080
npm run mobile     # รัน mobile testing port 8000
```

### Custom Port:
```bash
node server.js --port 8080    # ใช้ port 8080
node server.js --port 3001    # ใช้ port 3001
```

---

## 🐛 Troubleshooting

### ❌ "Port already in use"
```bash
# ใช้ port อื่น
node server.js --port 3001
```

### ❌ "Cannot access from mobile"
1. ตรวจสอบ firewall settings
2. ใช้ IP address ที่ถูกต้อง
3. ให้แน่ใจว่าอยู่ WiFi เดียวกัน

### ❌ "EACCES permission denied"
```bash
# ใช้ port > 1024
node server.js --port 3000
```

### ❌ "Your browser may not support all features"
**วิธีแก้:**
1. **Chrome:** ใช้ flags ด้านบน
2. **Firefox:** แก้ใน about:config
3. **หรือ:** กด "OK" แล้วใช้งานต่อได้ปกติ

---

## 📊 Server Features

### ✅ รองรับ:
- **Static Files:** HTML, CSS, JS, Images
- **Video Files:** MP4, WebM, MOV, AVI
- **CORS Headers:** สำหรับ cross-origin requests
- **Security Headers:** CSP, XSS Protection, etc.
- **MIME Types:** ครบถ้วนสำหรับทุกไฟล์
- **Error Pages:** 404 และ 500 แบบ custom
- **Mobile Friendly:** responsive design

### 📁 File Structure:
```
run-form-ai/
├── server.js          # Node.js server
├── index.html         # Main application
├── app.js            # Application logic
├── styles.css        # Styling
├── demo-config.js    # Configuration
├── test.html         # System testing
└── package.json      # Project config
```

---

## 🎯 Production Notes

### สำหรับ Production:
- ใช้ HTTPS
- เพิ่ม rate limiting
- เพิ่ม security headers
- ใช้ process manager (PM2)
- เพิ่ม logging

### สำหรับ Development:
- Server นี้เหมาะสำหรับ local testing
- ไม่ต้องติดตั้ง dependencies เพิ่ม
- รองรับ hot reload (รีเฟรชเอง)

---

## 💡 Tips

1. **Performance:** ใช้ Chrome สำหรับ testing ที่ดีที่สุด
2. **Mobile:** ใช้ landscape mode บนมือถือ
3. **Network:** ตรวจสอบ WiFi connection ให้แน่ใจ
4. **Debugging:** เปิด Developer Tools (F12) เพื่อดู logs
5. **Security Warning:** ใช้ Chrome flags หรือกด "OK" ได้เลย

---

**🚀 Ready to test RunForm.AI!** 