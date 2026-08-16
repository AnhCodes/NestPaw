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

/** Higgsfield subscription and credit-pack rates from higgsfield.ai/pricing. */
export const higgsfieldPricing = {
  headline: "Plus · $49/mo",
  usedFor: "Ad hooks and product video",
  site: "https://higgsfield.ai/pricing",
  plans: [
    { name: "Starter", price: "$15/mo", note: "200 credits / month" },
    {
      name: "Plus",
      price: "$49/mo",
      note: "$39/mo billed annually · 1,000 credits",
    },
    {
      name: "Ultra",
      price: "$129/mo",
      note: "$70/mo billed annually · 3,000 credits",
    },
  ],
  packs: [
    { name: "2,000 credits", price: "$95", note: "44% off · expires in 90 days" },
    { name: "4,000 credits", price: "$190", note: "44% off · expires in 90 days" },
  ],
} as const;
