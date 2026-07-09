import { SubscriptionPlan } from "../types";

export const SubscriptionManager = {
    checkAccess: (plan: SubscriptionPlan, feature: string) => {
        if (plan === 'Premium') return true;
        if (feature === 'basic-lessons') return true;
        return false;
    }
};
