import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * SECURED Middleware
 * - Checks authentication
 * - Validates user role for protected routes
 * - Redirects unauthorized users to appropriate dashboard
 */
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
  const publicPaths = ["/", "/login", "/auth/callback", "/auth/signout"];
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p));

  // Redirect to login if not authenticated
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 🔒 SECURITY: Role-based route protection
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "student";
    const url = request.nextUrl.clone();

    // Protect /admin routes - only HOD and Principal
    if (pathname.startsWith("/admin")) {
      if (!["hod", "principal"].includes(userRole)) {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }

    // Protect /teacher routes - only Teacher, HOD, and Principal
    if (pathname.startsWith("/teacher")) {
      if (!["teacher", "hod", "principal"].includes(userRole)) {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }

    // Protect /student routes - only Students
    if (pathname.startsWith("/student")) {
      if (userRole !== "student") {
        url.pathname = getDashboardByRole(userRole);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

/**
 * Get appropriate dashboard path based on user role
 */
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
