"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, setupRecaptcha, sendOtp, verifyOtp } from "@/lib/firebase-client";
import { fetchApi } from "@/lib/api-client";
import { Loader2, Phone, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";

type AuthView = "main" | "phone-input" | "otp-verify";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Phone auth state
  const [authView, setAuthView] = useState<AuthView>("main");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // ─── Handle session after any sign-in ──────────────────────────────────────
  const handlePostAuth = async () => {
    try {
      const response = await fetchApi<{ role?: string }>("/auth/session", {
        method: "POST",
      });

      if (response.role === "buyer") {
        router.push("/buyer/dashboard");
      } else if (response.role === "supplier") {
        router.push("/supplier/dashboard");
      } else {
        router.push("/select-role");
      }
    } catch {
      setError("Failed to create session. Is the API server running?");
      setIsSigningIn(false);
    }
  };

  // ─── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      await handlePostAuth();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google sign in failed. Please try again.");
      }
      setIsSigningIn(false);
    }
  };

  // ─── Phone: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleaned = phoneNumber.replace(/\s/g, "");
    if (cleaned.length < 10) {
      setError("Please enter a valid phone number with country code (e.g. +91 9999999999)");
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // Always create a fresh reCAPTCHA verifier to avoid "already rendered" errors
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      recaptchaVerifierRef.current = setupRecaptcha("recaptcha-container");

      const result = await sendOtp(cleaned, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setAuthView("otp-verify");
      setOtpTimer(30);
      setOtp(["", "", "", "", "", ""]);
      // Auto-focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      if (err?.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Use +91 followed by 10 digits.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("SMS not enabled for this region. Ask the project admin to enable it in Firebase Console → Authentication → Settings → SMS Region Policy.");
      } else {
        setError(`Failed to send OTP: ${err?.message || "Please try again."}`);
      }
      // Reset reCAPTCHA on error so it can be retried
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
      recaptchaVerifierRef.current = null;
    } finally {
      setIsSigningIn(false);
    }
  };

  // ─── Phone: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    if (!confirmationResult) {
      setError("Session expired. Please request a new OTP.");
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      await verifyOtp(confirmationResult, code);
      await handlePostAuth();
    } catch (err: any) {
      if (err?.code === "auth/invalid-verification-code") {
        setError("Wrong code. Please check and try again.");
      } else if (err?.code === "auth/code-expired") {
        setError("Code expired. Please request a new one.");
      } else {
        setError("Verification failed. Please try again.");
      }
      setIsSigningIn(false);
    }
  };

  // ─── OTP Input Handlers ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take last char
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      // Focus the next empty input or last input
      const nextEmpty = newOtp.findIndex((d) => !d);
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    recaptchaVerifierRef.current = null;
    setAuthView("phone-input");
    setError(null);
  };

  const goBack = () => {
    setAuthView("main");
    setError(null);
    setPhoneNumber("+91 ");
    setOtp(["", "", "", "", "", ""]);
    setConfirmationResult(null);
    recaptchaVerifierRef.current = null;
  };

  return (
    <div className="min-h-screen bg-surface-base flex" id="login-page">
      {/* Left Panel — Gradient + Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 items-center justify-center">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-buyer/40 via-teal-300/50 to-cyan-300/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/20 rounded-full blur-2xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-buyer to-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-extrabold text-3xl">S</span>
          </div>
          <h2 className="font-jakarta font-bold text-heading text-3xl mb-3">Supply Sync</h2>
          <p className="text-muted text-lg">Smarter sourcing, simplified.</p>
        </motion.div>
      </div>

      {/* Right Panel — Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="elevated-card p-8">
            <AnimatePresence mode="wait">
              {/* ═══════════ MAIN VIEW ═══════════ */}
              {authView === "main" && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Tab Toggle */}
                  <div className="flex items-center gap-4 mb-8">
                    <button
                      onClick={() => setActiveTab("login")}
                      className={`font-jakarta font-semibold text-lg pb-1 border-b-2 transition-colors ${
                        activeTab === "login"
                          ? "text-heading border-buyer"
                          : "text-muted border-transparent hover:text-body"
                      }`}
                    >
                      Login
                    </button>
                    <span className="text-subtle">/</span>
                    <button
                      onClick={() => setActiveTab("signup")}
                      className={`font-jakarta font-semibold text-lg pb-1 border-b-2 transition-colors ${
                        activeTab === "signup"
                          ? "text-heading border-buyer"
                          : "text-muted border-transparent hover:text-body"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Google Auth Button */}
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-buyer hover:bg-buyer-soft font-semibold text-heading transition-all duration-200 disabled:opacity-50"
                    id="google-auth-btn"
                  >
                    {isSigningIn ? (
                      <Loader2 className="w-5 h-5 animate-spin text-buyer" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-subtle text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Phone Auth Button */}
                  <button
                    onClick={() => {
                      setAuthView("phone-input");
                      setError(null);
                    }}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-buyer hover:bg-buyer-soft font-semibold text-heading transition-all duration-200 disabled:opacity-50"
                    id="phone-auth-btn"
                  >
                    <Phone className="w-5 h-5 text-buyer" />
                    Continue with Phone
                  </button>

                  {/* Sign up / Login toggle */}
                  <p className="text-center text-sm text-muted mt-6">
                    {activeTab === "login" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button onClick={() => setActiveTab("signup")} className="font-semibold text-heading hover:text-buyer transition-colors">
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button onClick={() => setActiveTab("login")} className="font-semibold text-heading hover:text-buyer transition-colors">
                          Login
                        </button>
                      </>
                    )}
                  </p>
                </motion.div>
              )}

              {/* ═══════════ PHONE INPUT VIEW ═══════════ */}
              {authView === "phone-input" && (
                <motion.div
                  key="phone-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1 text-sm text-muted hover:text-heading font-medium mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-buyer-soft flex items-center justify-center">
                      <Phone className="w-5 h-5 text-buyer" />
                    </div>
                    <div>
                      <h2 className="font-jakarta font-bold text-heading text-xl">
                        Enter your phone number
                      </h2>
                      <p className="text-muted text-sm">We&apos;ll send you a 6-digit OTP</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9999999999"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-heading placeholder:text-subtle text-sm focus:border-buyer focus:ring-2 focus:ring-buyer-ring outline-none transition-all text-lg tracking-wide"
                        id="phone-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendOtp();
                        }}
                      />
                      <p className="text-xs text-subtle mt-1.5">
                        Include country code (e.g. +91 for India)
                      </p>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={isSigningIn}
                      className="w-full btn-primary-buyer py-3 text-sm flex items-center justify-center gap-2"
                      id="send-otp-btn"
                    >
                      {isSigningIn ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══════════ OTP VERIFICATION VIEW ═══════════ */}
              {authView === "otp-verify" && (
                <motion.div
                  key="otp-verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => {
                      setAuthView("phone-input");
                      setError(null);
                    }}
                    className="flex items-center gap-1 text-sm text-muted hover:text-heading font-medium mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change number
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-buyer-soft flex items-center justify-center mb-4">
                      <Phone className="w-7 h-7 text-buyer" />
                    </div>
                    <h2 className="font-jakarta font-bold text-heading text-xl mb-1">
                      Verify your number
                    </h2>
                    <p className="text-muted text-sm">
                      Enter the 6-digit code sent to{" "}
                      <span className="font-semibold text-heading">{phoneNumber}</span>
                    </p>
                  </div>

                  {/* OTP Input Boxes */}
                  <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                          digit
                            ? "border-buyer bg-buyer-soft text-heading"
                            : "border-gray-200 bg-white text-heading"
                        } focus:border-buyer focus:ring-2 focus:ring-buyer-ring`}
                        id={`otp-input-${index}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={isSigningIn || otp.join("").length !== 6}
                    className="w-full btn-primary-buyer py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    id="verify-otp-btn"
                  >
                    {isSigningIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center mt-4">
                    {otpTimer > 0 ? (
                      <p className="text-sm text-subtle">
                        Resend code in <span className="font-semibold text-heading">{otpTimer}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="text-sm font-semibold text-buyer hover:text-buyer/80 transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error — shown in all views */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center mt-4 bg-red-50 border border-red-100 rounded-lg py-2 px-3"
              >
                {error}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />
    </div>
  );
}
