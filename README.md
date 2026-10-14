# 🎓 EduTrack — Tuition Tracker & Student-Teacher Learning Hub

A full-stack Tuition Tracker application with a persistent database, interactive multi-option payment gateway (Stripe card, PayPal, UPI, bKash/mobile banking), real-time direct student-teacher communication, attendance tracker, homework submissions, and exam gradebook built using **React**, **Tailwind CSS**, and **Node.js/Express**.

---

## 🌟 Newly Added Features

### 1. 🔐 Sign Up & Login Authentication (Teachers & Students)
- **Teacher Registration**: Register with Name, Email, Password, Phone, Teaching Subject/Title, and Hourly/Monthly rate.
- **Student Registration**: Register with Name, Email, Password, Phone, and Grade/Class level (e.g. HSC 1st/2nd Year, Class 10, A-Levels).
- **Persistent Session**: Secure login with saved session and logout options.
- **Demo Quick Access**: 1-click preset account logins remain available in the navigation bar for instant testing.

### 2. 👥 Teacher Student Management (Add & Remove)
- Teachers can add new students into the system directly.
- Teachers can **Remove Students** with one click (automatically cleans up their enrollments and attendance records).
- Teachers can enroll or unenroll students from specific tuition batches.

### 3. 📚 Full Course & Schedule CRUD (Add, Edit, Remove, & Edit Times)
- Teachers can **Add New Courses** with subject, grade, schedule days, time slots, fees, and Google Meet/Zoom links.
- Teachers can **Edit Courses & Class Times** anytime via the edit modal.
- Teachers can **Remove/Delete Courses** safely with confirmation warnings.

### 4. ⏰ Student Course Reschedule & Time Change Requests
- Students can submit a **"Request Time Change"** for any of their enrolled batches.
- Students specify their preferred new time slot (e.g. `06:30 PM - 08:00 PM`) and state the reason (e.g. school exam timing, coaching shift).
- Teachers receive the request with an **Incoming Reschedule Alert** and can **Approve & Update Class Time** (which automatically updates the batch schedule across the entire database) or **Decline**.

### 5. 🇧🇩 Currency in Bangladeshi Taka (৳ / BDT) with Live Currency Switcher
- Default currency is set to **Bangladeshi Taka (`৳` BDT)** across all course fees, dues, invoices, and payment receipts.
- **Editable & Customizable Currency**: Users can click the currency pill in the navigation bar to switch between:
  - 🇧🇩 **Bangladeshi Taka (৳ BDT)**
  - 🇺🇸 **US Dollar ($ USD)**
  - 🇪🇺 **Euro (€ EUR)**
  - 🇬🇧 **British Pound (£ GBP)**
  - 🇮🇳 **Indian Rupee (₹ INR)**
  - 🇦🇪 **UAE Dirham (د.إ AED)**
  - Or enter any custom currency symbol and code.

### 6. 🏷️ Applied Tuition Discounts & Waivers
- Teachers can apply discounts when generating student tuition invoices:
  - **Percentage Discount**: e.g. 10%, 15%, 25% waiver.
  - **Fixed Amount Discount**: e.g. ৳ 500, ৳ 1,000 off.
  - **Discount Reason / Coupon**: e.g. *"Merit Scholarship"*, *"Sibling Discount"*, *"Early Bird Waiver"*.
- Invoices and payment receipts display the itemized breakdown:
  - **Base Fee**: `৳ 3,500`
  - **Discount Applied**: `-৳ 350` (10% - Sibling Waiver)
  - **Final Payable Amount**: `৳ 3,150`
- The Payment Gateway charges the exact discounted amount.

### 7. ⚡ True Offline-First Architecture & Offline App Support
- **Complete Client-Side Offline Database (`offlineDb.js`)**:
  - Full relational dataset stored persistently in browser/device `localStorage`.
  - Zero-latency responses (0ms lag, no network timeouts, no failed spinners).
  - All operations persist locally: add/edit/delete classes, mark attendance, generate invoices, record payments, post homework, submit assignments, enter exam grades, send messages, and submit reschedule requests.
- **PWA Service Worker (`sw.js`) & Caching**:
  - App shell and static assets are cached automatically so the app opens and runs instantly without internet.
  - Installable as a standalone app on desktop and mobile home screen.
- **Live Connection Mode Selector**:
  - **⚡ Offline Mode**: 100% device-only storage, zero network dependency.
  - **📡 Local Wi-Fi PC Server**: `http://192.168.1.5:5000`
  - **☁️ Cloud Server**: Render or custom API backend.
- **Database Backup & Restore**:
  - **Download Backup**: Export entire database as a `.json` backup file.
  - **Restore Backup**: 1-click restore from any exported backup file.
  - **Reset Demo**: Restore default realistic educational dataset at any time.

---

## 🏗️ Project Architecture

```
app/
├── client/                     # React Frontend (Vite + Tailwind CSS + PWA)
│   ├── public/
│   │   ├── sw.js               # Service Worker for offline PWA asset caching
│   │   ├── manifest.json       # PWA Web App Manifest
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── offlineDb.js        # Offline-First Persistent Database Engine
│   │   ├── api.js              # Intelligent API client (routes to offlineDb or backend)
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation, Offline/Server pill, Currency & Persona switcher
│   │   │   ├── ServerConfigModal.jsx   # Offline/Server switcher, DB stats, Backup Export/Import
│   │   │   ├── OfflineBanner.jsx       # Floating offline mode active alert & shortcuts
│   │   │   ├── Sidebar.jsx             # Left sidebar navigation
│   │   │   ├── DashboardOverview.jsx   # Metrics, alerts, and quick timetable
│   │   │   ├── InvoicesView.jsx        # Fee tracking, discount badges, & invoices table
│   │   │   ├── PaymentModal.jsx        # Multi-option Payment Gateway (Card, PayPal, UPI, bKash)
│   │   │   ├── InvoiceReceiptModal.jsx # Official printable invoice & receipt with discounts
│   │   │   ├── CreateInvoiceModal.jsx  # Invoice generation modal with applied discounts
│   │   │   ├── TimeChangeModal.jsx     # Student course reschedule request modal
│   │   │   ├── CurrencyModal.jsx       # Currency settings & switcher modal
│   │   │   ├── AuthModal.jsx           # Sign Up & Sign In modal for Teachers & Students
│   │   │   ├── ChatView.jsx            # Student-teacher live messaging
│   │   │   ├── ClassesView.jsx         # Tuition batches CRUD, edit time, & requests review
│   │   │   ├── AttendanceTracker.jsx   # Attendance sheet & matrix
│   │   │   ├── AssignmentsView.jsx     # Homework posting & grading
│   │   │   ├── GradebookView.jsx       # Exam scores & marks
│   │   │   ├── AnnouncementsView.jsx   # Noticeboard broadcast
│   │   │   └── StudentsView.jsx        # Student profiles & remove student actions
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Authentication, Currency settings, & formatMoney
│   │   ├── App.jsx                     # Root application coordinator
│   │   └── main.jsx                    # React entrypoint & Service Worker registration
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     # Express Backend & Database
│   ├── data/
│   │   └── database.json       # Persistent relational JSON database
│   ├── db.js                   # Database models & seeding logic
│   ├── server.js               # REST API endpoints & static serving
│   └── package.json
│
└── dev-runner.js               # Concurrently runner
```

---

## 🚀 Running the App

### 1. ⚡ Run Pure Offline App (No Backend Server Needed)
```bash
npm run offline
```
Or:
```bash
npm --prefix client run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. All features work immediately with zero server or internet requirements.

### 2. 🌐 Run Full Stack (Frontend + Express Backend)
```bash
npm run dev
```
Or start each service separately:
- Backend: `npm run server` (runs on `http://localhost:5000`)
- Frontend: `npm run client` (runs on `http://localhost:3000`)

### 3. 📱 Sync Android Native App (Capacitor)
```bash
npm run sync:android
```
