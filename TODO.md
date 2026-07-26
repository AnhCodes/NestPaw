# NestPaw — To-do

- [ ] Finalize inquiries on Alibaba and buy sample stock
- [ ] Improve SEOs for websites
- [ ] Improve image qualities for items on catalog

## Stripe payment setup

- [ ] Create / finish Stripe account activation (business details, bank payout)
- [ ] Copy **test** keys into `store/.env.local` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Set local `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and run a full test checkout
- [ ] Add the same Stripe env vars in Vercel (Project → Settings → Environment Variables) for Production + Preview
- [ ] After deploy, set `NEXT_PUBLIC_SITE_URL` to the live Vercel URL (then custom domain when ready)
- [ ] Verify success / cancel redirects and US shipping address collection on a real Preview/Production URL
- [ ] Switch Vercel + local to **live** keys (`sk_live_` / `pk_live_`) when ready to take real payments
- [ ] (Optional) Add Stripe webhook endpoint for `checkout.session.completed` to log/fulfill orders automatically
