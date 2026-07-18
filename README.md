<div align="center">
  <img src="https://raw.githubusercontent.com/Ilyan321/attendance-app/main/public/vite.svg" alt="EduFocus Logo" width="100" />
  
  # EduFocus: Attendance Portal

  **Modern attendance tracking and academic class management, designed for the next generation of educators.**

  [![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-DB_&_Auth-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)

  [View Live Demo](https://Ilyan321.github.io/attendance-app/) • [Report Bug](#-contributing) • [Request Feature](#-contributing)
</div>

---

## ✨ Overview

EduFocus is a premium, enterprise-grade Single Page Application (SPA) built to solve the hassle of manual attendance tracking. Designed with an impeccable, minimalist aesthetic, EduFocus provides educators with a seamless, blazing-fast interface to manage classes, record daily attendance, visualize schedules, and export historical data.

By combining the bleeding-edge performance of **Vite + React** with the powerful Backend-as-a-Service capabilities of **Supabase**, EduFocus offers real-time synchronization, secure authentication, and a frictionless user experience.

---

## 🚀 Key Features

- **🛡️ Secure Authentication**: Powered by Supabase Auth, ensuring educator data is private and secure.
- **📚 Class Management**: Create, edit, and organize academic classes by Subject, Department, and Student Roll Numbers.
- **✅ Lightning-Fast Attendance**: A beautifully tailored interface to mark students present/absent with dynamic topic logging.
- **📅 Visual Schedule**: A dedicated calendar view to track your weekly class timings at a glance.
- **📊 Advanced Exporting**: Instantly generate matrix-style CSV reports of attendance history, calculating total attendances and percentages automatically.
- **🎨 Premium UI/UX**: Built with an Instagram-style smooth navigation flow, custom modals, and zero native browser alerts.
- **📱 Fully Responsive**: Flawless experience across desktop, tablet, and mobile devices with a sticky mobile navigation bar.

---

## 🛠️ Tech Stack

### Frontend Architecture
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router DOM (HashRouter for GH Pages compatibility)
- **Styling**: Tailwind CSS v4 (Custom Enterprise Configuration)
- **Icons**: Google Material Symbols (Outlined)

### Backend & Infrastructure
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Hosting**: GitHub Pages (`gh-pages`)

---

## 💻 Local Development

Follow these steps to set up EduFocus locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase Project (for database and auth)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ilyan321/attendance-app.git
   cd attendance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to `http://localhost:5173` in your browser.

---

## 🗄️ Database Schema (Supabase)

EduFocus relies on two primary tables in Supabase:

1. **`classes`**
   - `id` (uuid, Primary Key)
   - `teacher_id` (uuid, Foreign Key to Auth Users)
   - `subjectName` (text)
   - `department` (text)
   - `subjectCode` (text)
   - `student_roll_numbers` (text array)
   - `presentStudents` (text array)
   - `attendanceTopic` (text)
   - `created_at` (timestamp)

2. **`schedules`**
   - `id` (uuid, Primary Key)
   - `class_id` (uuid, Foreign Key to classes)
   - `day_of_week` (text)
   - `time` (text)
   - `title` (text)
   - `teacher_id` (uuid)

*(Note: Requires Row Level Security (RLS) policies configured to ensure `teacher_id === auth.uid()` for secure data access).*

---

## 🎨 Design Philosophy

EduFocus strictly adheres to a **Minimalist Enterprise Architecture**:
- **Color Palette**: Focused on high-contrast readability with a sleek `surface-container-low` foundational background and vibrant `primary` accents.
- **Typography**: Utilizing `Geist` and `Inter` for exceptional legibility.
- **Interactions**: Soft hover states, micro-animations (`animate-in`, `fade-in`), and slide-in views rather than jarring popups.

---

## 👥 The Team

EduFocus was proudly developed by **Team Seneca**:
- **Ilyan Khan** 
- **Rameen Jalal**
- **Zainab**

---

## 📄 License

This project is licensed under the MIT License. Copyright © 2026 EduFocus. All rights reserved.
