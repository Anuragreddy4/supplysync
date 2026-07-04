import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:123456"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ─── Google Sign-In ──────────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// ─── Phone (OTP) Sign-In ─────────────────────────────────────────────────────

/**
 * Sets up the invisible reCAPTCHA verifier on a given HTML element.
 * Call this once before sending the OTP.
 */
export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
  const verifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — will proceed with signInWithPhoneNumber
    },
  });
  return verifier;
}

/**
 * Sends an OTP to the given phone number.
 * Returns a ConfirmationResult that you use to verify the OTP code.
 */
export async function sendOtp(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP", error);
    throw error;
  }
}

/**
 * Verifies the OTP code entered by the user.
 * On success, the user is signed in and Firebase sets the auth state.
 */
export async function verifyOtp(confirmationResult: ConfirmationResult, otpCode: string) {
  try {
    const result = await confirmationResult.confirm(otpCode);
    return result.user;
  } catch (error) {
    console.error("Error verifying OTP", error);
    throw error;
  }
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const signOut = () => firebaseSignOut(auth);
