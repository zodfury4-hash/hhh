# HEA Link — Production PHP & SQLite URL Shortener (Stage 1)

Full Glassmorphism landing page + real functional PHP backend + SQLite database + Admin Control Panel.

---

## 📁 Architecture & Folder Structure

```text
hea-link-website/
├── data/                       # [IMPORTANT] public_html ke BAHAR rakha gaya hai
│   ├── app.db                  # SQLite database (links, clicks, admins, login_attempts)
│   └── .htaccess               # Web access blocked (Deny from all)
│
├── public_html/                # Hostinger ya Apache ka web root
│   ├── .htaccess               # /abc ko redirect.php par 302 route karta hai
│   ├── index.php               # Glassmorphism homepage + live link shortener form
│   ├── redirect.php            # 302 direct lookup, device/referrer logging + counter
│   ├── style.css               # Full Glassmorphism theme (Orbs, frosted glass, gradients)
│   ├── script.js               # AJAX bridge, dynamic QR code & clipboard copy
│   │
│   ├── api/
│   │   └── shorten.php         # Secure JSON API (CSRF protected)
│   │
│   ├── admin/
│   │   ├── login.php           # Glassmorphic Admin login (brute-force rate limited)
│   │   ├── dashboard.php       # Links table, click counters, delete & direct create
│   │   └── logout.php          # Session termination
│   │
│   └── inc/
│       ├── db.php              # SQLite PDO connection & auto-table creation
│       ├── functions.php       # Security, URL validation, random slug & CSRF helpers
│       └── auth.php            # Session auth & lockout mechanism
│
├── run_server.bat              # 1-Click Local PHP server starter for Windows
└── README.md
```

---

## ⚡ 1. Local Testing (Windows / XAMPP)

Aapke system par XAMPP PHP maujood hai. Test karne ke 2 aasan tareeqay hain:

### Tareeqa A (1-Click Run):
`C:\Users\Fury\StudioProjects\hea-link-website\` folder mein jayein aur **`run_server.bat`** par double click karein.
- Browser mein website foran khul jayegi: `http://localhost:8000`

### Tareeqa B (VS Code Terminal se):
Terminal mein yeh command chalayein:
```bash
"C:\xampp\php\php.exe" -S localhost:8000 -t public_html
```

---

## 🔐 2. Admin Credentials

- **URL:** `http://localhost:8000/admin/login.php`
- **Username:** `admin`
- **Password:** `Admin@123`

---

## 🌐 3. Hostinger Par Deploy Karne Ka Tareeqa

1. **Hostinger File Manager** open karein:
   - Apne hosting account ke `public_html/` folder mein hamaray `public_html/` ke andar ki tamam files upload karein (`.htaccess` zaroor upload karein).
   - `data/` folder ko `public_html` ke bahar (root folder mein) upload karein taake koi bhi browser se direct database file download na kar sakay.
2. **Permissions**:
   - `data/` folder aur `app.db` file ko write permission (0755 ya 0775) honi chahiye taake SQLite clicks record kar sakay.
3. **SSL Activation**:
   - Hostinger panel se Free SSL activate karein.
4. **DNS Setup**:
   - Agar domain Hostinger par hai: DNS auto-configured hota hai.
   - Agar kisi doosray registrar par hai: Hostinger Nameservers (`ns1.dns-parking.com`, `ns2.dns-parking.com`) set karein ya `A Record` Hostinger IP par point karein.

---

## 🛡️ Security Features Included:
- **302 Temporary Redirect**: Browser caching bypass hoti hai aur har click accurate count hota hai.
- **SQLite Auto-Setup**: Tables aur indices pehli dafa khud generate ho jate hain.
- **CSRF Protection**: Tamam forms aur AJAX requests cryptographic tokens se verified hain.
- **XSS Protection**: Tamam dynamic outputs `htmlspecialchars()` se sanitized hain.
- **Brute-Force Lockout**: 5 ghalat login attempts ke baad IP 15 minutes ke liye lock ho jati hai.
