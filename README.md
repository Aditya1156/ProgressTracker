# 🎓 ProgressTracker - Academic Performance Management System

A comprehensive Next.js application for tracking student academic performance, managing exams, and facilitating teacher-student feedback.

## ✨ Features

### 👨‍🎓 Student Portal
- View personalized dashboard with performance overview
- Access all exam results and grades
- Receive feedback from teachers
- Track performance trends and subject-wise breakdown

### 👨‍🏫 Teacher Portal
- Monitor student performance and identify at-risk students
- Enter and manage exam marks
- Create new exams
- Send personalized feedback to students
- View complete student lists with analytics

### 👔 Admin/HOD Portal
- Institution-wide dashboard with key metrics
- Department performance comparison
- Detailed analytics with charts and trends
- Manage students, teachers, and exams
- At-risk student identification

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Language:** TypeScript

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account ([sign up here](https://supabase.com))
- Git (optional, for cloning)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya1156/ProgressTracker.git
cd ProgressTracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to Project Settings → API
3. Copy your project URL and anon key

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 5. Set Up Database

#### Run Schema Migration

In your Supabase dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Execute the SQL script

Or via command line (if you have psql installed):

```bash
psql $DATABASE_URL < supabase/schema.sql
```

#### Seed the Database (Optional)

```bash
psql $DATABASE_URL < supabase/seed.sql
```

This will create sample data including departments, test users, subjects, exams, and marks.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Test Accounts

After seeding, you can log in with these test accounts:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Principal | principal@acadtrack.edu | test123 | `/admin` |
| HOD | hod.cse@acadtrack.edu | test123 | `/admin` |
| Teacher | teacher1@acadtrack.edu | test123 | `/teacher` |
| Student | student1@acadtrack.edu | test123 | `/student` |

## 📁 Project Structure

```
ProgressTracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin/HOD dashboard
│   │   ├── teacher/           # Teacher portal
│   │   ├── student/           # Student portal
│   │   ├── api/               # API routes
│   │   └── auth/              # Authentication routes
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   └── lib/                   # Utility functions
├── supabase/                  # Database schema and seed
└── ...config files
```

## 🔌 API Routes

- `GET /api/analytics` - System-wide analytics
- `GET /api/marks/export` - Export marks with filters
- `GET /api/students/stats?studentId={id}` - Individual student statistics
- `GET /api/feedback/unread` - Get unread feedback
- `POST /api/feedback/unread` - Mark feedback as read

## 🎨 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aditya**
- GitHub: [@Aditya1156](https://github.com/Aditya1156)

---

Made with ❤️ for better education management
