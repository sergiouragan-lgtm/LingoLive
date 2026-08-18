const envDays = parseInt(process.env.PAYMENT_GRACE_PERIOD_DAYS || "7", 10);
export const PAYMENT_GRACE_PERIOD_DAYS = (!isNaN(envDays) && envDays >= 1 && envDays <= 30) ? envDays : 7;

export const SERVER_PLANS: Record<string, any> = {
  individual_monthly: {
    name: "Individual Mensal",
    amount: 9.99,
    currency: "usd",
    interval: "month",
  },
  family_monthly: {
    name: "Família Mensal",
    amount: 19.99,
    currency: "usd",
    interval: "month",
  },
  trial_starter: {
    name: "Período de Experiência",
    amount: 4.90,
    currency: "usd",
    interval: "month",
  },
  monthly: {
    name: "Plano Mensal",
    amount: 5.00,
    currency: "usd",
    interval: "month",
  },
  quarterly: {
    name: "Plano Trimestral",
    amount: 15.00,
    currency: "usd",
    interval: "month",
  },
  yearly: {
    name: "Plano Anual",
    amount: 60.00,
    currency: "usd",
    interval: "year",
  }
};
