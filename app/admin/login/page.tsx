"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavVisibility } from "@/lib/useNavVisibility";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const isVisible = useNavVisibility();
  const prefersReduced = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="-mt-16 min-h-screen flex flex-col pt-16">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #fff inset;
          -webkit-text-fill-color: #000;
          caret-color: #000;
        }
      `}</style>
      {/* Admin header bar — fixed top, scrolls away like the public navbar */}
      <div className="fixed top-0 inset-x-0 z-50">
        <motion.div
          animate={{ y: isVisible || prefersReduced ? 0 : "-100%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ willChange: "transform" }}
        >
          <header className="bg-yellow-400 h-16 px-4 sm:px-6 lg:px-8">
            <div className="h-16 grid grid-cols-3 items-center">
              <div />
              <div className="flex items-center justify-center">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/images/logo-transparent.png"
                    alt="Happy Camera"
                    width={58}
                    height={58}
                    priority
                    quality={100}
                    className="h-12 md:h-[58px] w-auto object-contain"
                  />
                </Link>
              </div>
              <div className="flex items-center justify-end">
                <Link
                  href="/"
                  className="group flex items-center gap-1.5 text-xs font-semibold tracking-wide text-black hover:text-black/80 transition-colors py-2 px-1"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                  <span className="relative">
                    Back to store
                    <span className="absolute -bottom-px left-0 right-0 h-px bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </span>
                </Link>
              </div>
            </div>
          </header>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* Left panel — image hero */}
        <div className="relative w-full md:w-[60%] h-[35vh] md:h-auto bg-black shrink-0">
        <Image
          src="/images/new-login.jpg"
          alt="Happy Camera — curated gear"
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
          priority
          quality={80}
        />
        <div className="absolute inset-0 bg-black/40 z-10" />

      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8F7F4]">
        <div className="w-full max-w-sm">
          {/* Mobile header hidden inside form panel */}
          <div className="md:hidden flex items-center gap-2.5 mb-3">
            <Camera size={20} className="text-black" />
            <span className="text-sm font-bold tracking-tight text-[#1A1A1A]">
              Happy Camera
            </span>
          </div>
          <p className="md:hidden text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B] mb-6">
            Admin Access
          </p>
          {/* Desktop header hidden inside form panel */}
          <div className="hidden md:flex items-center gap-2.5 mb-1">
            <Camera size={20} className="text-black" />
            <span className="text-sm font-bold tracking-tight text-[#1A1A1A]">
              Happy Camera
            </span>
          </div>
          <p className="hidden md:block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B] mb-8">
            Admin Access
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border border-[#E5E3DE] bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors rounded-none"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#E5E3DE] bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors rounded-none pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={18} className="text-[#666]" /> : <Eye size={18} className="text-[#666]" />}
                </button>
              </div>
              <div className="mt-1.5 flex justify-end">
                <Link
                  href="/admin/forgot-password"
                  className="text-[11px] text-[#6B6B6B] hover:text-[#1A1A1A] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-400 text-black text-sm font-semibold py-3 tracking-wide hover:bg-yellow-300 transition-colors rounded-none"
            >
              Sign In
            </button>
          </form>

          {/* Yellow accent bar */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E3DE]" />
            <div className="w-8 h-0.5 bg-yellow-400" />
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
              Happy Camera Admin
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
