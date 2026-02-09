-- ============================================================================
-- COLLEGE EXAM & ACADEMIC INTELLIGENCE SYSTEM
-- PostgreSQL Schema for Supabase
-- ============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── PROFILES (linked to auth.users) ──────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  role        text not null default 'student' check (role in ('student', 'teacher', 'hod', 'principal')),
  college_id  text not null default 'MAIN',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────
create table public.departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,       -- e.g. "CSE", "ECE", "ME"
  full_name   text not null,              -- e.g. "Computer Science & Engineering"
  college_id  text not null default 'MAIN',
  created_at  timestamptz not null default now()
);

-- ─── STUDENTS ─────────────────────────────────────────────────────────────
create table public.students (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null unique references public.profiles(id) on delete cascade,
  roll_no         text not null unique,
  department_id   uuid not null references public.departments(id),
  batch           text not null,          -- e.g. "2024"
  semester        int not null default 1,
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now()
);

-- ─── TEACHERS ─────────────────────────────────────────────────────────────
create table public.teachers (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null unique references public.profiles(id) on delete cascade,
  department_id   uuid not null references public.departments(id),
  designation     text not null default 'Assistant Professor',
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now()
);

-- ─── SUBJECTS ─────────────────────────────────────────────────────────────
create table public.subjects (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,          -- e.g. "Mathematics-I"
  code            text not null unique,   -- e.g. "MA101"
  department_id   uuid not null references public.departments(id),
  semester        int not null,
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now()
);

-- ─── EXAMS ────────────────────────────────────────────────────────────────
create table public.exams (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,          -- e.g. "Mid Sem Mathematics-I"
  type            text not null check (type in ('class_test', 'mid_sem', 'end_sem', 'assignment', 'practical')),
  subject_id      uuid not null references public.subjects(id),
  max_marks       int not null,
  exam_date       date not null,
  created_by      uuid references public.profiles(id),
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now()
);

-- ─── MARKS ────────────────────────────────────────────────────────────────
create table public.marks (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  exam_id         uuid not null references public.exams(id) on delete cascade,
  marks_obtained  numeric(5,1) not null,
  entered_by      uuid references public.profiles(id),
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(student_id, exam_id)
);

-- ─── FEEDBACK ─────────────────────────────────────────────────────────────
create table public.feedback (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  teacher_id      uuid not null references public.teachers(id),
  subject_id      uuid references public.subjects(id),
  type            text not null default 'general' check (type in ('general', 'improvement', 'appreciation', 'concern')),
  message         text not null,
  is_read         boolean not null default false,
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────
create index idx_students_dept on public.students(department_id);
create index idx_students_batch on public.students(batch);
create index idx_marks_student on public.marks(student_id);
create index idx_marks_exam on public.marks(exam_id);
create index idx_exams_subject on public.exams(subject_id);
create index idx_feedback_student on public.feedback(student_id);
create index idx_feedback_teacher on public.feedback(teacher_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_marks_updated before update on public.marks
  for each row execute function public.handle_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Philosophy: "Even if frontend is hacked, database must stay safe."
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.exams enable row level security;
alter table public.marks enable row level security;
alter table public.feedback enable row level security;

-- Helper: get current user's role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: check if user is admin (hod or principal)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role in ('hod', 'principal')
  );
$$ language sql security definer stable;

-- Helper: check if user is teacher
create or replace function public.is_teacher_or_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role in ('teacher', 'hod', 'principal')
  );
$$ language sql security definer stable;

-- PROFILES: everyone can read, only self can update
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

-- DEPARTMENTS: everyone can read
create policy "Departments are viewable by all"
  on public.departments for select to authenticated using (true);

create policy "Admins can manage departments"
  on public.departments for all to authenticated using (public.is_admin());

-- STUDENTS: students see own, teachers/admins see all
create policy "Students can view own record"
  on public.students for select to authenticated
  using (profile_id = auth.uid() or public.is_teacher_or_admin());

create policy "Admins can manage students"
  on public.students for all to authenticated using (public.is_admin());

-- TEACHERS: teachers see own, admins see all
create policy "Teachers viewable by authenticated"
  on public.teachers for select to authenticated using (true);

create policy "Admins can manage teachers"
  on public.teachers for all to authenticated using (public.is_admin());

-- SUBJECTS: everyone can read
create policy "Subjects are viewable by all"
  on public.subjects for select to authenticated using (true);

create policy "Teachers and admins can manage subjects"
  on public.subjects for all to authenticated using (public.is_teacher_or_admin());

-- EXAMS: everyone can read, teachers/admins can create
create policy "Exams are viewable by all"
  on public.exams for select to authenticated using (true);

create policy "Teachers can manage exams"
  on public.exams for all to authenticated using (public.is_teacher_or_admin());

-- MARKS: students see own, teachers/admins see all
create policy "Students can view own marks"
  on public.marks for select to authenticated
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
    or public.is_teacher_or_admin()
  );

create policy "Teachers can manage marks"
  on public.marks for all to authenticated using (public.is_teacher_or_admin());

-- FEEDBACK: students see own, teachers see own given, admins see all
create policy "Students can view own feedback"
  on public.feedback for select to authenticated
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
    or teacher_id in (select id from public.teachers where profile_id = auth.uid())
    or public.is_admin()
  );

create policy "Teachers can create feedback"
  on public.feedback for insert to authenticated
  with check (public.is_teacher_or_admin());

create policy "Teachers can update own feedback"
  on public.feedback for update to authenticated
  using (
    teacher_id in (select id from public.teachers where profile_id = auth.uid())
    or public.is_admin()
  );
