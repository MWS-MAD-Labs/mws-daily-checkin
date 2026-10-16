# Frontend Refactor Guide

Dokumen ini adalah peta singkat frontend aktif. Baca ini sebelum memindahkan atau menghapus file.

## 1. Alur aplikasi yang benar

```text
index.html
  -> src/main.jsx                 bootstrap React, Redux, router, auth awal
    -> src/App.jsx                global app shell dan global overlay
      ├── src/apps/user/UserApp.jsx
      │   -> src/apps/user/desktop/pages/*.jsx
      └── src/apps/admin/AdminApp.jsx
          -> src/apps/admin/pages/*.jsx
              -> src/services/*   request API
              -> src/store/*      global state Redux
```

`@/` adalah alias untuk `src/`. Contoh: `@/apps/user/desktop/pages/ProfilePage` berarti `src/apps/user/desktop/pages/ProfilePage.jsx`.

`src/components/app/RouteConfig.jsx` sudah tidak digunakan. Setiap app sekarang memiliki route-nya sendiri.

`src/apps/user/mobile/` sengaja masih kosong. Tampilan mobile baru akan dibuat belakangan; implementasi user yang sekarang disimpan sebagai desktop tanpa perubahan visual.

## 2. Routing

Route user didefinisikan di `src/apps/user/UserApp.jsx`. Route dashboard dan manajemen didefinisikan di `src/apps/admin/AdminApp.jsx`.

Vite dan React Router memakai base `/daily-checkin`, sehingga:

```text
UserApp path="/home" -> URL browser /daily-checkin/home
```

Jangan menulis `/daily-checkin` di `<Link>`, `navigate()`, atau `path`. Prefix ditambahkan otomatis oleh router.

| Route internal | Page |
|---|---|
| `/` | `RootRedirect` |
| `/home` | `RoleSelectionPage` (staff) |
| `/emotional-checkin` | `EmotionalCheckinPage` |
| `/emotional-checkin/staff` | `EmotionalCheckinStaffPage` |
| `/emotional-checkin/face-scan` | `VerificationPage` |
| `/emotional-checkin/dashboard` | `EmotionalCheckinDashboard` |
| `/student/support-hub` | `StudentSupportHubPage` |
| `/student/emotional-checkin` | `StudentEmotionalCheckinPage` |
| `/student/emotional-checkin/manual` | `StudentManualCheckinPage` |
| `/student/emotional-checkin/ai` | `StudentAICheckinPage` |
| `/student/emotional-checkin/face-scan` | `StudentFaceScanPage` |

`ProtectedRoute` menangani login, permission, tipe user, dan redirect. Jangan duplikasi pengecekan akses di page.

## 3. Fungsi folder

```text
src/
├── app/bootstrap/        startup auth, theme, dan service worker
├── apps/user/            route dan presentation aplikasi user
│   ├── UserApp.jsx       seluruh route aplikasi user
│   ├── mobile/           disiapkan untuk UI mobile baru (belum digunakan)
│   ├── desktop/          implementasi user yang aktif sekarang
│   │   ├── pages/        halaman yang dipasang ke route user
│   │   ├── components/   komponen khusus halaman user
│   │   ├── features/     helper/hooks per flow user
│   │   └── layouts/      layout khusus desktop
│   └── shared/           components dan hooks milik user yang lintas device
├── apps/admin/           route dan presentation dashboard/admin
│   ├── pages/            halaman dashboard dan manajemen
│   ├── layouts/          layout khusus admin
│   └── components/       komponen khusus admin
├── components/app/       global shell, routing, overlay, dock
├── components/ui/        komponen UI dasar/reusable
├── components/           komponen lintas fitur
├── pages/                page lama/lintas app yang belum dimigrasikan
├── pages/styles/         CSS khusus page/flow
├── services/             komunikasi API/socket
├── store/slices/         Redux state dan async action
├── hooks/                reusable React behavior
├── utils/                fungsi non-UI
├── constants/            permission dan enum
├── index.css             token dan global CSS
├── App.jsx               root app aktif
└── main.jsx              entry point aktif
```

`main.jsx` hanya merakit provider global dan me-render `App`. Detail startup berada di `src/app/bootstrap/`.

## 4. Urutan refactor frontend

Kerjakan bertahap dan jangan mengubah struktur serta desain sekaligus.

### Tahap 1 — Routing berdasarkan pemilik app

Tahap ini sudah dikerjakan:

```text
src/App.jsx
├── src/apps/user/UserApp.jsx
└── src/apps/admin/AdminApp.jsx
```

Root `App.jsx` hanya memilih app aktif dan menyediakan global shell. Masing-masing app memiliki route, lazy import, dan `ProtectedRoute` sendiri tanpa mengubah URL lama.

### Tahap 2 — Rapikan kepemilikan file user

Tahap ini memindahkan page, komponen, dan helper user lama ke `src/apps/user/desktop/` tanpa mengubah tampilan atau behavior. Folder `src/apps/user/mobile/` tidak disentuh sampai desain mobile baru dikerjakan.

### Tahap 3 — Refactor satu flow sampai selesai

Mulai dari flow student karena batasnya paling jelas:

```text
StudentSupportHubPage
  -> StudentEmotionalCheckinPage
    -> StudentManualCheckinPage
    -> StudentAICheckinPage
    -> StudentFaceScanPage
```

Untuk setiap page:

1. Page hanya mengatur data, state, dan navigasi.
2. Pecah bagian visual menjadi komponen maksimal sekitar 150 baris.
3. Pindahkan request HTTP ke `services/`.
4. Pindahkan reusable behavior ke `hooks/`.
5. Pindahkan data statis seperti option/list ke file `*.data.js`.
6. Verifikasi desktop setelah setiap page; pengujian mobile dilakukan saat implementasi mobile baru dimulai.

Baru setelah flow student stabil, lanjutkan flow staff:

```text
RoleSelectionPage
  -> EmotionalCheckinPage
  -> VerificationPage
  -> EmotionalCheckinStaffPage
  -> dashboard pages
```

## 5. Target struktur user

Pisahkan berdasarkan tampilan dan kepemilikan app:

```text
src/apps/user/
├── UserApp.jsx
├── desktop/
│   ├── pages/
│   ├── components/
│   ├── features/
│   └── layouts/
├── mobile/
│   ├── pages/
│   ├── components/
│   └── layouts/
└── shared/
    ├── components/
    └── hooks/
```

Route tetap menjadi pintu masuk. Kode desktop dan mobile tidak saling mengimpor komponen presentation; hanya kode di `shared/` yang boleh dipakai keduanya.

## 6. Checklist sebelum commit

Jalankan dari folder `frontend`:

```bash
npm run lint
npm run build
npm run engineering:report
```

Untuk setiap perubahan pastikan:

- URL lama masih bisa dibuka.
- Permission/redirect tidak berubah.
- Loading, error, empty, dan success state tetap ada.
- Tidak ada API call yang pindah ke komponen visual.
- Tampilan aman di lebar 360 px.
- Tombol utama tetap mudah ditekan dan tidak tertutup overlay.

## 7. Titik mulai berikutnya

Setelah relokasi user stabil dan build lolos, desain mobile baru dapat dikerjakan terpisah di `src/apps/user/mobile/`. Jangan memindahkan atau menyalin style desktop ke sana sebelum desain mobile ditentukan.
