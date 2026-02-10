# 🔒 Security Fixes - Implementation Guide

Apply these fixes to secure your application.

---

## FIX 1: Remove SERVICE_ROLE_KEY ⚠️ CRITICAL

### Action: Delete from .env.local

**Current `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gjdkuyzujvpmpjeyvqtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  ← DELETE THIS LINE
```

**Fixed `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gjdkuyzujvpmpjeyvqtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZGt1eXp1anZwbXBqZXl2cXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDc0NjgsImV4cCI6MjA4NjIyMzQ2OH0.lVDOyzxdayHu9dTqUX677vMteU4JogRVSNAXPN96zV4
```

**Why:** The ANON key is safe for client-side use. The SERVICE_ROLE_KEY bypasses ALL security.

---

## FIX 2: Add Role Verification to Admin Layout ⚠️ HIGH PRIORITY

### File: `src/app/admin/layout.tsx`

**Current Code:**
```typescript
import { getUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function AdminLayout({ children }) {
  const user = await getUser();
  return <AppShell user={user}>{children}</AppShell>;
}
```

**Fixed Code:**
```typescript
import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function AdminLayout({ children }) {
  const user = await getUser();

  // Check if user has admin role
  if (!isAdmin(user.role)) {
    redirect("/student"); // Redirect non-admins to their dashboard
  }

  return <AppShell user={user}>{children}</AppShell>;
}
```

**What Changed:**
- Added role check before rendering
- Redirects non-admin users to student dashboard
- Uses existing `isAdmin()` function from `lib/auth.ts`

---

## FIX 3: Add Role Verification to Teacher Layout

### File: `src/app/teacher/layout.tsx`

**Add Similar Protection:**
```typescript
import { getUser, canManageAcademics } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function TeacherLayout({ children }) {
  const user = await getUser();

  // Only teachers, HODs, and principals can access
  if (!canManageAcademics(user.role)) {
    redirect("/student");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
```

---

## FIX 4: Enhance Middleware with Role-Based Routing ⚠️ HIGH PRIORITY

### File: `src/lib/supabase/middleware.ts`

**Current Code:**
```typescript
export async function updateSession(request: NextRequest) {
  // ... existing code ...

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Fixed Code:**
```typescript
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicPaths = ["/", "/login", "/auth/callback"];
  const isPublicPath = publicPaths.some((p) => pathname === p);

  // Redirect to login if not authenticated
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ NEW: Role-based route protection
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "student";
    const url = request.nextUrl.clone();

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (!["hod", "principal"].includes(userRole)) {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }

    // Teacher routes
    if (pathname.startsWith("/teacher")) {
      if (!["teacher", "hod", "principal"].includes(userRole)) {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }

    // Student routes
    if (pathname.startsWith("/student")) {
      if (userRole !== "student") {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

// Helper function
function getDashboardByRole(role: string): string {
  switch (role) {
    case "principal":
    case "hod":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
    default:
      return "/student";
  }
}
```

**What Changed:**
- Added role fetching from database
- Added route protection based on user role
- Redirects users to their appropriate dashboard
- Prevents unauthorized access to admin/teacher routes

---

## FIX 5: Add Input Validation to API Routes

### Example: `src/app/api/students/stats/route.ts`

**Add Validation:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");

    // ✅ VALIDATE INPUT
    if (!studentId || !UUID_REGEX.test(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID format" },
        { status: 400 }
      );
    }

    // ... rest of the code
  } catch (error) {
    console.error("Student stats API error:", error);
    // ✅ DON'T LEAK ERROR DETAILS
    return NextResponse.json(
      { error: "An error occurred while fetching student statistics" },
      { status: 500 }
    );
  }
}
```

---

## FIX 6: Strengthen Password Requirements

### File: `src/app/login/page.tsx`

**Current:**
```tsx
<Input
  type="password"
  required
  minLength={6}
/>
```

**Fixed:**
```tsx
<Input
  type="password"
  required
  minLength={8}
  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
  title="Password must be at least 8 characters with uppercase, lowercase, and number"
/>
```

**Or Better - Use Client-Side Validation:**
```tsx
const [password, setPassword] = useState("");
const [passwordError, setPasswordError] = useState("");

function validatePassword(pwd: string): boolean {
  if (pwd.length < 8) {
    setPasswordError("Password must be at least 8 characters");
    return false;
  }
  if (!/[A-Z]/.test(pwd)) {
    setPasswordError("Password must contain uppercase letter");
    return false;
  }
  if (!/[a-z]/.test(pwd)) {
    setPasswordError("Password must contain lowercase letter");
    return false;
  }
  if (!/\d/.test(pwd)) {
    setPasswordError("Password must contain a number");
    return false;
  }
  setPasswordError("");
  return true;
}

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (mode === "signup" && !validatePassword(password)) {
    return;
  }

  // ... rest of code
}
```

---

## FIX 7: Add Security Headers

### File: `next.config.ts`

**Add:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## FIX 8: Add Rate Limiting (Optional but Recommended)

### Install Package:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Create Rate Limiter:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 s"), // 5 requests per 10 seconds
  analytics: true,
});
```

### Use in Login API:
```typescript
// In login page or API route
const { success } = await ratelimit.limit(email);
if (!success) {
  toast.error("Too many attempts. Please try again later.");
  return;
}
```

---

## 📝 Implementation Checklist

Apply these fixes in order:

- [ ] **Step 1:** Remove SERVICE_ROLE_KEY from .env.local
- [ ] **Step 2:** Update admin layout with role check
- [ ] **Step 3:** Update teacher layout with role check
- [ ] **Step 4:** Update middleware with role-based routing
- [ ] **Step 5:** Add input validation to API routes
- [ ] **Step 6:** Strengthen password requirements
- [ ] **Step 7:** Add security headers to next.config.ts
- [ ] **Step 8:** (Optional) Add rate limiting

---

## 🧪 Testing After Fixes

1. **Test Authorization:**
   - Login as student
   - Try to access `/admin` → Should redirect to `/student`
   - Try to access `/teacher` → Should redirect to `/student`

2. **Test Admin Access:**
   - Login as HOD
   - Access `/admin` → Should work
   - Access `/student` → Should redirect to `/admin`

3. **Test API Protection:**
   - Try accessing API routes without auth → 401 error
   - Try accessing with invalid input → 400 error

4. **Test Password Strength:**
   - Try weak password → Should reject
   - Try strong password → Should accept

---

## ⚠️ CRITICAL: After Applying Fixes

1. **Clear browser cache and cookies**
2. **Test all user roles**
3. **Verify RLS policies still work**
4. **Test on production environment**

---

**Security is an ongoing process. Review and update regularly!**
