# 🚀 Sona Store

A modern Play Store–style web application where developers can upload APK or PWA apps and users can browse, preview, and download them.

Built with a clean UI, Supabase backend, and cloud storage integration.

---

## 🌟 Features

- 🔐 User Authentication (User / Developer / Admin roles)
- 📦 APK & PWA Upload Support
- ☁️ Supabase Storage Integration
- 🖼 Screenshot Upload System
- ⭐ Review & Rating System
- 📊 Download Tracking
- 🛠 Admin Approval System
- 🎨 Modern Play Store–style UI

---

## 🏗 Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js / Express
- Database: PostgreSQL (Supabase)
- Storage: Supabase Storage
- Hosting: (Add your deployment platform here)

---

## 🗂 Database Structure

- users
- apps
- screenshots
- reviews
- downloads

All tables use UUID primary keys.

---

## 🔐 Roles

- user – Can browse, download, review apps
- developer – Can upload and manage apps
- admin – Can approve/reject apps

---

## 🚀 Deployment

1. Clone the repository
2. Install dependencies
3. Setup `.env` file
4. Connect Supabase project
5. Run development server

```bash
npm install
npm run dev
