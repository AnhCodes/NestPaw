/** US standard Stripe Payments rates, as published at stripe.com/pricing. */
export const stripePricing = {
  headline: "2.9% + $0.30",
  rates: [
    { name: "Online cards and wallets", rate: "2.9% + $0.30" },
    { name: "International cards", rate: "+1.5%" },
    { name: "Currency conversion", rate: "+1%" },
    { name: "ACH Direct Debit", rate: "0.8%, cap $5" },
    { name: "Dispute", rate: "$15" },
  ],
} as const;
