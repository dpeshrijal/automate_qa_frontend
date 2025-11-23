"use server";

import { signIn as nextAuthSignIn } from "@/auth";
import { createUser } from "@/lib/user";
import { AuthError } from "next-auth";

export async function signIn(email: string, password: string) {
  try {
    await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message || "Invalid credentials" };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function signUp(email: string, password: string, name?: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one number",
      };
    }

    // Create user in DynamoDB
    await createUser(email, password, name);

    // Automatically sign in
    const signInResult = await signIn(email, password);

    if (!signInResult.success) {
      return {
        success: false,
        error: "Account created but failed to sign in. Please try signing in manually.",
      };
    }

    return { success: true };
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return { success: false, error: "User with this email already exists" };
    }
    return { success: false, error: error.message || "Failed to create account" };
  }
}
