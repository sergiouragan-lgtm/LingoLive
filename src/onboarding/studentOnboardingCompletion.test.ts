import { describe, expect, it } from "vitest";

import { ageGroupFromAge, completeStudentOnboarding } from "./studentOnboardingCompletion";

describe("student onboarding completion contract", () => {
  it("completes the learning profile without fabricating payment or subscription state", () => {
    const result = completeStudentOnboarding({ paymentCompleted: false, subscriptionStatus: "pending" }, { age: 25, level: "B1" });
    expect(result).toMatchObject({ onboardingCompleted: true, welcomeCompleted: true, paymentCompleted: false, subscriptionStatus: "pending" });
  });

  it("does not create financial fields when they do not exist", () => {
    const result = completeStudentOnboarding(undefined, { age: 10 });
    expect(result).not.toHaveProperty("paymentCompleted");
    expect(result).not.toHaveProperty("subscriptionStatus");
  });

  it.each([
    [7, "Infancy"], [8, "Kids"], [11, "Kids"], [12, "PreTeens"],
    [15, "PreTeens"], [16, "Teens"], [17, "Teens"], [18, "ADULT"], [35, "ADULT"],
  ] as const)("maps age %s to %s", (age, expected) => {
    expect(ageGroupFromAge(age)).toBe(expected);
  });
});
