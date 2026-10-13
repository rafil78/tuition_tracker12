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

---

## 🏗️ Project Architecture

```
app/
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation, Currency pill, & Persona switcher
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
│   │   ├── api.js                      # REST API client
│   │   ├── App.jsx                     # Root application coordinator
│   │   └── main.jsx                    # React entrypoint
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

The server is currently running and serves both the API and client at:
👉 **[http://localhost:5000](http://localhost:5000)**

To run or restart the server:
```bash
node server/server.js
```
