import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public pages under /admin — reachable without a session.
const PUBLIC_ADMIN_PREFIXES = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

// Admin-only API routes, matched by path prefix + HTTP method.
const ADMIN_API_RULES: { prefix: string; methods: string[] }[] = [
  { prefix: "/api/products", methods: ["POST"] },
  { prefix: "/api/products/", methods: ["PATCH", "DELETE"] },
  { prefix: "/api/orders/manual", methods: ["POST"] },
  { prefix: "/api/orders/", methods: ["PATCH", "POST"] },
  { prefix: "/api/reviews/", methods: ["PATCH"] },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // Route sign-in errors away from the admin page to the customer-facing
  // /login, which maps them to generic messages (preserves callbackUrl).
  if (pathname === "/api/auth/signin") {
    const error = req.nextUrl.searchParams.get("error");
    if (error) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", error);
      const callbackUrl = req.cookies.get("next-auth.callback-url")?.value;
      if (callbackUrl) loginUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Admin pages
  if (isAdminPage) {
    const isPublic = PUBLIC_ADMIN_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isPublic) return NextResponse.next();

if (rule) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Admin API routes
  const rule = ADMIN_API_RULES.find(
    (r) =>
      r.methods.includes(req.method) &&
      (pathname === r.prefix || pathname.startsWith(r.prefix))
  );
  if (rule) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/auth/:path*",
    "/api/products/:path*",
    "/api/orders/:path*",
    "/api/reviews/:path*",
  ],
};
