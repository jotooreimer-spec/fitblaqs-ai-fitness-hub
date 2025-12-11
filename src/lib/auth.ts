import { supabase } from "@/integrations/supabase/client";

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: {
    name: string;
    age: string;
    weight: string;
    height: string;
    gender: string;
    language: string;
  }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: userData,
    },
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  // Robust logout for Web, PWA, and Android APK
  try {
    await supabase.auth.signOut();
  } catch (e) {
    // Ignore errors - proceed with logout anyway
    console.log("Sign out completed");
  }

  // Clear local storage safely (may fail in some APK contexts)
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    // Ignore storage errors
  }
};

// Check if user has completed onboarding
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.has_completed_onboarding === true;
  } catch (e) {
    return false;
  }
};

// Mark onboarding as completed
export const completeOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_onboarding: true })
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    return false;
  }
};
