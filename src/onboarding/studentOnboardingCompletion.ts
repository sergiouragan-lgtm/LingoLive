import type { AgeGroup } from "../types";

type ProfileData = Record<string, unknown>;

export function completeStudentOnboarding(existingProfile: ProfileData | null | undefined, onboardingData: ProfileData): ProfileData {
  return {
    ...(existingProfile ?? {}),
    ...onboardingData,
    status: "ACTIVE",
    welcomeCompleted: true,
    onboardingCompleted: true,
  };
}

export function ageGroupFromAge(age: number): AgeGroup {
  if (age < 8) return "Infancy";
  if (age < 12) return "Kids";
  if (age < 16) return "PreTeens";
  if (age < 18) return "Teens";
  return "ADULT";
}
