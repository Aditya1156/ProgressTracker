# 🛡️ How to Apply Security Fixes

Follow these steps to secure your application.

---

## ⚠️ CRITICAL: Before You Start

1. **Backup your database** (export from Supabase dashboard)
2. **Commit current code to git** (`git commit -am "Pre-security-fixes backup"`)
3. **Test in development first**

---

## 📋 Step-by-Step Instructions

### STEP 1: Remove SERVICE_ROLE_KEY ⚠️ IMMEDIATE

**File:** `.env.local`

**Action:**
```bash
# Open .env.local and remove this line:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Your .env.local should ONLY have:
NEXT_PUBLIC_SUPABASE_URL=https://gjdkuyzujvpmpjeyvqtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### STEP 2: Replace Middleware

**File:** `src/lib/supabase/middleware.ts`

**Action:**
```bash
# Windows Command Prompt:
copy src\lib\supabase\middleware-SECURE.ts src\lib\supabase\middleware.ts

# Or manually copy contents from middleware-SECURE.ts to middleware.ts
```

---

### STEP 3: Replace Admin Layout

**File:** `src/app/admin/layout.tsx`

**Action:**
```bash
# Windows Command Prompt:
copy src\app\admin\layout-SECURE.tsx src\app\admin\layout.tsx

# Or manually copy contents from layout-SECURE.tsx to layout.tsx
```

---

### STEP 4: Replace Teacher Layout

**File:** `src/app/teacher/layout.tsx`

**Action:**
```bash
# Windows Command Prompt:
copy src\app\teacher\layout-SECURE.tsx src\app\teacher\layout.tsx

# Or manually copy contents from layout-SECURE.tsx to layout.tsx
```

---

### STEP 5: Add Validation Library

**File:** `src/lib/validation.ts`

**Action:** ✅ This file is already created, no action needed.

---

### STEP 6: Secure API Routes

**File:** `src/app/api/students/stats/route.ts`

**Action:**
```bash
# Windows Command Prompt:
copy src\app\api\students\stats\route-SECURE.ts src\app\api\students\stats\route.ts

# Or manually copy contents
```

---

### STEP 7: Security Headers

**Action:** ✅ Already updated in `next.config.ts`

---

### STEP 8: Test Everything

```bash
# Clear Next.js cache
rmdir /s /q .next

# Restart development server
npm run dev
```

**Test Plan:**

1. **Test as Student:**
   - Login with student account
   - Try to access `/admin` → Should redirect to `/student`
   - Try to access `/teacher` → Should redirect to `/student`

2. **Test as Teacher:**
   - Login with teacher account
   - Verify can access `/teacher`
   - Try to access `/admin` → Should redirect to `/teacher`

3. **Test as HOD:**
   - Login with HOD account (`hod.cse@pesitm.edu.in / admin123`)
   - Verify can access `/admin`

4. **Test as Principal:**
   - Login with principal (`principal@pesitm.edu.in / admin123`)
   - Verify can access everything

---

## 🧹 Cleanup

After testing successfully:

```bash
# Remove backup secure files
del src\app\admin\layout-SECURE.tsx
del src\app\teacher\layout-SECURE.tsx
del src\lib\supabase\middleware-SECURE.ts
del src\app\api\students\stats\route-SECURE.ts

# Commit the changes
git add .
git commit -m "Apply security fixes: authorization, validation, headers"
```

---

## 📊 Verification Checklist

- [ ] Removed SERVICE_ROLE_KEY from .env.local
- [ ] Updated middleware with role checks
- [ ] Updated admin layout with authorization
- [ ] Updated teacher layout with authorization
- [ ] Added validation library
- [ ] Secured API routes
- [ ] Added security headers
- [ ] Tested as student (blocked from admin/teacher)
- [ ] Tested as teacher (can access teacher, blocked from admin)
- [ ] Tested as HOD (can access admin)
- [ ] Tested as principal (full access)
- [ ] No console errors
- [ ] Ready for production

---

**Remember: Security is not a one-time task. Review regularly!**
