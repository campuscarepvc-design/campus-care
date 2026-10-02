# CAMPUS CARE

> Modern College Campus Problem Reporting & Infrastructure Maintenance Network

CAMPUS CARE is a role-separated institutional complaint resolution system connecting **Students**, **Faculty**, and the **Head of Department (HOD)**. It provides real-time ticket tracking, priority escalation, photo attachments, internal messaging between complainants and administration, and role-based access control.

---

## 🚀 Features

- **Student Portal (`STU1001`)**:
  - Report classroom, laboratory, hostel, Wi-Fi, sanitation, or electrical faults.
  - Photo attachments with preview and size/MIME validation.
  - Live timeline tracking (`Pending` → `Under Review` → `Assigned` → `In Progress` → `Resolved`).
  - Direct two-way messaging with HOD on reported tickets.

- **Faculty Portal (`FAC1001`)**:
  - Escalate lab equipment breakdowns, seminar hall AV failures, and academic facility needs.
  - Upload supporting equipment logs, photos, and fault memos.
  - Track department-level maintenance velocity.

- **HOD Command Center (`HOD1001`)**:
  - Oversee all campus complaints and faculty escalations.
  - Assign technicians across dedicated maintenance wings (Electrical, Water, IT, Cleaning & Civil).
  - Update ticket statuses with official administrative remarks.
  - Campus maintenance performance metrics and analytics.

- **Security & Authentication**:
  - Secure bcrypt password hashing with constant-time verification.
  - Signed JWT tokens with immediate server-side revocation on logout.
  - First-time login mandatory password reset workflow.
  - Forgot password / verification code recovery system.
  - Zero password or secret exposure in client-facing APIs.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, Multer, JWT, BcryptJS
- **Database**: Persistent JSON Database layer (`data/campus_care_db.json`)
- **Deployment**: Vercel Serverless (`/api`) + Vite Static Build (`/dist`)

---

## 📦 Vercel Deployment Guide

### 1. Import to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import your GitHub repository: `campuscarepvc-design/campus-care`.
4. Vercel automatically detects the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2. Configure Environment Variables in Vercel
In your Vercel Project Settings under **Environment Variables**, add:

| Variable | Description | Recommended / Example Value |
|---|---|---|
| `JWT_SECRET` | Secret key for signing authentication JWT tokens | *(Generate a secure 32+ character string)* |
| `STUDENT_DEFAULT_PASSWORD` | Initial password for Student demo account | *(Set custom initial password)* |
| `FACULTY_DEFAULT_PASSWORD` | Initial password for Faculty demo account | *(Set custom initial password)* |
| `HOD_DEFAULT_PASSWORD` | Initial password for HOD demo account | *(Set custom initial password)* |
| `GEMINI_API_KEY` | Optional AI features API key | *(Your Gemini API key if enabled)* |

### 3. Deploy
Click **Deploy**. Vercel will build the frontend assets and deploy the backend `/api` routes as Serverless Functions.

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (runs full-stack Vite + Express):
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Build & Lint Checks

- **Run Type Checks & Lint**:
  ```bash
  npm run lint
  ```

- **Production Build**:
  ```bash
  npm run build
  ```
