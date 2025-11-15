"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user exists in the system first
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.exists) {
        setError("No account found with this email address. Please contact your administrator for access.");
        setLoading(false);
        return;
      }

      // User exists, send OTP
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      setOtpSent(true);
    } catch (err) {
      console.error("OTP error:", err);
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid code");
      }

      // Auto-set active organization if user has only one
      const orgResponse = await fetch("/api/auth/set-active-org", {
        method: "POST",
        credentials: "include",
      });

      const orgData = await orgResponse.json();

      // Handle multi-org scenario
      if (!orgData.success && orgData.organizations && orgData.organizations.length > 1) {
        // TODO: Redirect to org selection page when implemented
        // For now, just set the first org as active
        console.warn("User has multiple orgs. Using first org as default.");
        // Continue with normal flow - user can switch orgs in settings later
      }

      // Check if user is platform admin and redirect accordingly
      const session = await authClient.getSession();
      const isPlatformAdmin = session?.data?.user?.role === "admin";

      router.push(isPlatformAdmin ? "/admin" : "/");
      router.refresh();
    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f9fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900">MyPak - Kavop</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {!otpSent ? "Sign in to your account" : `Code sent to ${email}`}
          </p>
        </div>

        <Card className="bg-white">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Email Input Form */}
            {!otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Sending code..." : "Continue with email"}
                </Button>
              </form>
            )}

            {/* Code Verification Form */}
            {otpSent && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={loading}
                    maxLength={6}
                    className="h-14 text-center text-2xl font-mono tracking-widest"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code we sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Verifying..." : "Sign in"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  ← Use a different email
                </Button>
              </form>
            )}

          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Secure OTP authentication
        </p>
      </div>
    </div>
  );
}

