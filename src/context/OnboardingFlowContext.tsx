import React, { createContext, useContext, useState, ReactNode } from "react";

export type OnboardingStep = 
  | "ONBOARDING" 
  | "PROFILE_CREATED" 
  | "PAYMENT_REQUIRED" 
  | "PAYMENT_SUCCESS" 
  | "DASHBOARD";

interface OnboardingFlowContextType {
  currentStep: OnboardingStep;
  setStep: (step: OnboardingStep) => void;
  profileData: any;
  setProfileData: (data: any) => void;
}

const OnboardingFlowContext = createContext<OnboardingFlowContextType | undefined>(undefined);

export const OnboardingFlowProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setStep] = useState<OnboardingStep>("ONBOARDING");
  const [profileData, setProfileData] = useState<any>(null);

  return (
    <OnboardingFlowContext.Provider value={{ currentStep, setStep, profileData, setProfileData }}>
      {children}
    </OnboardingFlowContext.Provider>
  );
};

export const useOnboardingFlow = () => {
  const context = useContext(OnboardingFlowContext);
  if (!context) {
    return {
      currentStep: "ONBOARDING" as OnboardingStep,
      setStep: () => {},
      profileData: null,
      setProfileData: () => {}
    };
  }
  return context;
};
