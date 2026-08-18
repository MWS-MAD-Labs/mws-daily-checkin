Saya sudah membuat initial UI untuk `/support-hub`, tetapi setelah melihat hasilnya saya merasa UI/UX-nya masih belum terasa seperti application hub yang matang.

Saya ingin kamu **mereview dan redesign UI/UX yang sekarang**, bukan sekadar mempercantik visualnya.

Saya lampirkan screenshot current implementation sebagai referensi kondisi saat ini.

## Masalah yang saya lihat sekarang

### 1. Application muncul dua kali

Saat ini ada section di bagian atas yang menampilkan beberapa aplikasi:

```text
Report Assistant
MTSS Dashboard
Daily Emotional Check-in
```

kemudian aplikasi yang sama muncul lagi di:

```text
All Applications
```

Ini terasa redundant.

Kalau section atas memang dimaksudkan sebagai `Recently Used`, `Frequently Used`, atau `Featured`, maka harus memiliki tujuan yang jelas.

Jangan hanya menampilkan aplikasi yang sama secara random di dua tempat.

Kalau belum ada data untuk `Recently Used`, lebih baik section tersebut tidak ditampilkan daripada membuat duplicate content.

---

## 2. Sidebar Categories terasa terlalu berat

Saat ini category berada di sidebar kiri:

```text
Categories

All
Reporting
Teaching & Students
Workplace
Operations
Utilities
```

Untuk application hub dengan jumlah aplikasi sekitar 20–30 aplikasi, saya merasa sidebar ini mengambil terlalu banyak ruang horizontal.

Saya ingin kamu mempertimbangkan apakah category lebih baik dibuat sebagai horizontal filter/navigation:

```text
All
Reporting
Teaching & Students
Workplace
Operations
Utilities
```

di atas application grid.

Namun jangan langsung mengikuti contoh ini.

Analisis dulu apakah sidebar memang dibutuhkan atau tidak.

---

## 3. Terlalu banyak ruang kosong di desktop

Current layout tidak menggunakan seluruh horizontal space dengan optimal.

Application grid terasa terlalu sempit sehingga sisi kanan halaman memiliki banyak whitespace.

Saya ingin application grid dapat memanfaatkan available viewport dengan lebih baik.

Pertimbangkan responsive grid seperti:

```text
Desktop:
4–5 cards per row

Tablet:
2–3 cards per row

Mobile:
1–2 cards per row
```

Tetapi jumlah kolom harus ditentukan berdasarkan card width yang nyaman, bukan dipaksakan.

---

## 4. Application card terasa terlalu seperti dashboard cards

Current card memiliki struktur:

```text
Icon
Application Name
Description
Divider
Category
```

Secara visual sudah clean, tetapi karena semua card memiliki ukuran dan struktur yang sama, halaman terasa seperti dashboard penuh card.

Ingat bahwa `/support-hub` adalah **application launcher**, bukan analytics dashboard.

Prioritasnya adalah:

```text
Find application
→ Understand application
→ Open application
```

Jadi card sebaiknya compact, scannable, dan tidak terlalu tinggi.

Jangan membuat description terlalu panjang.

---

# Desired UX Direction

Saya ingin `/support-hub` terasa seperti kombinasi dari:

* Okta End-User Dashboard
* Microsoft Entra My Apps
* Microsoft Viva Connections

Tetapi lebih sederhana dan lebih sesuai dengan MWS.

Konsep utamanya:

> A clean internal application portal where users can quickly find and launch the MWS applications available to them.

Bukan:

> A dashboard containing a bunch of cards.

---

# Suggested Information Hierarchy

Saya ingin kamu mempertimbangkan struktur seperti:

```text
Header
    ↓
Page introduction / Welcome
    ↓
Search
    ↓
Category filters
    ↓
Recently Used / Frequently Used (optional)
    ↓
All Applications
    ↓
Application Grid
```

Contoh:

```text
┌──────────────────────────────────────────────────────────────┐
│ MWS Hub                                      User / Profile  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Support Hub                                                  │
│ Your MWS applications, tools, and resources.                 │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search applications...                              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ All   Reporting   Teaching   Operations   Resources   IT      │
│                                                              │
│ Recently Used                                                │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│ │ Reading    │ │ Report     │ │ MWS Guide  │                │
│ │ Buddy      │ │ Assistant  │ │            │                │
│ └────────────┘ └────────────┘ └────────────┘                │
│                                                              │
│ All Applications                                             │
│                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Report     │ │ Progress   │ │ Report     │ │ Slides     │ │
│ │ Assistant  │ │ Tracker    │ │ Auditor    │ │ Generator  │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

This is only a direction, **not a strict design to copy**.

Use your own UX judgment.

---

# Application Catalog

The current applications are:

```text
Report Assistant
https://mws.web.id/report-assistant
Teachers
Generate individualized student reports.

Slides to PDF
https://mws.web.id/slides-pdf
Public
Convert slides within a folder into individual PDF files.

Slides Generator
https://mws.web.id/slide-generator
Admin
Generate student slide report templates.

Report Progress Tracker
https://mws.web.id/progress-tracker
Teachers
Track student report progress.

Slides Batch Editor
https://mws.web.id/sbe
Public
Edit slides within a folder in batch.

Report Auditor
https://mws.web.id/slide-auditor
Teachers
Find pronoun and student-name mistakes.

Ticket Scanner
Google Apps Script
Public
Scan ticket QR codes and record the data to Sheets.

New IT Assets Database
Google Apps Script
Admin
IT Assets database and data-entry application.

Self Report IDP Dashboard
https://mws.web.id/ad-idp
Staff
Access Personal Development report data.

ChatGPT Login Code Generator
https://mws.web.id/gpt-code
Staff
Generate login verification codes automatically.

Drive File Duplicator and Sharer
https://mws.web.id/dupnshare
Staff
Create and share named file duplicates.

MTSS Dashboard
https://app.millenniaws.sch.id/mtss
Teachers, Principals, Director
MTSS management dashboard.

Daily Emotional Check-in
https://app.millenniaws.sch.id/select-role
Student, Teachers, Staff, Principals, Director
Daily emotional check-in and analytics.

Reading Buddy
https://reads.mws.web.id/
Teachers, Staff
MWS e-library platform.

Tech-Scans Dashboard
https://mws.web.id/tech-scans
MAD Labs
Tech-scans submission dashboard.

ProofPoint
https://proof.mws.web.id/
Teachers, Staff, Principals, Director
Performance appraisal and observation platform.

Exima
https://exima.mws.web.id/
Resource
Inventory-related data export/import and kiosk tools.

Woko - Work Orders
https://woko.mws.web.id
Head Unit, Principal, Director
Facilities work-order tracking.

MWS Guide
https://guide.mws.web.id/
Staff
MWS knowledge base.
```

Use these applications as realistic content when evaluating the UI.

---

# Important UX Principles

Please follow these principles.

### 1. Application discovery is the primary goal

The user should immediately understand:

> "This is where I find the MWS applications I can use."

### 2. Reduce visual noise

Avoid:

* unnecessary badges
* excessive colors
* oversized cards
* excessive shadows
* excessive rounded containers
* redundant sections

### 3. Don't over-design it

This is an internal MWS tool.

It should feel:

* professional
* clean
* calm
* functional
* fast
* easy to scan

Not like a marketing landing page.

### 4. Use whitespace intentionally

Whitespace is good, but don't leave large unused areas when the application grid could use the available width.

### 5. Keep cards compact

The application name and short description are the most important information.

The card should communicate the application purpose in 1–2 seconds.

### 6. Don't duplicate applications

If an application appears in `Recently Used`, `Featured`, etc., decide whether duplication in `All Applications` is actually useful.

If necessary, keep it in the main list but make the distinction meaningful.

### 7. Mobile-first behavior

The design must work naturally on:

```text
Desktop
Tablet
Mobile
```

Don't simply shrink the desktop layout.

---

# Future Requirements

Keep these future requirements in mind, but **do not implement them yet**.

## RBAC

Eventually:

```text
User
 ↓
Role(s)
 ↓
Application permissions
 ↓
Visible applications
```

Users should only see applications they have access to.

## Application Status

Applications will eventually support:

```text
Active
Maintenance
New
```

## Request Access

Users may eventually request access to applications they cannot access.

## Report Broken Tool

Users may eventually report when an application is broken.

## No-Code Catalog Management

Admins/MAD Labs should eventually be able to manage:

```text
Application
Name
Description
URL
Category
Icon
Status
Role access
Visibility
```

The current UI should be designed so these future features can be added without restructuring the entire page.

---

# What I Want From You

Please do **not** immediately write a large amount of code.

First, review the current UI and explain:

1. What is currently working well.
2. What feels wrong from a UX perspective.
3. What should be removed.
4. What should be changed.
5. What should remain.
6. What the ideal information hierarchy should be.
7. Whether we should keep or remove the sidebar.
8. How the application grid should behave.
9. How `Recently Used` / `Featured` should work.
10. What the final page structure should look like.

Then propose a revised `/support-hub` wireframe/layout.

After we agree on the UX direction, we can implement the redesign step-by-step.

**Do not implement RBAC, OAuth, API integration, or backend functionality yet.**

Focus exclusively on making `/support-hub` a clean, intuitive, scalable **MWS application launcher**.
