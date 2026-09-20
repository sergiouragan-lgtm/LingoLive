# Stripe Production Setup & Deployment Guide

**Status**: Ready for Implementation  
**Last Updated**: 2026-09-20  
**Timeline**: 4-6 hours (setup + testing + deployment)

---

## Pre-Requisites

- [ ] Stripe account with live mode enabled
- [ ] API keys generated (Secret Key + Publishable Key)
- [ ] Webhook Secret generated
- [ ] Production domain/URL finalized

---

## Part 1: Stripe Dashboard Configuration

### 1.1 - Generate API Keys

**Steps**:
1. Go to https://dashboard.stripe.com/apikeys
2. Create new API key pair for "Production"
3. Copy **Secret Key** → `STRIPE_SECRET_KEY`
4. Copy **Publishable Key** → `VITE_STRIPE_PUBLISHABLE_KEY`

### 1.2 - Generate Webhook Secret

**Steps**:
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://api.lingolive.com/api/stripe-webhook`
4. Select events:
   ```
   ✅ checkout.session.completed
   ✅ checkout.session.async_payment_succeeded
   ✅ checkout.session.async_payment_failed
   ✅ invoice.paid
   ✅ invoice.payment_failed
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ charge.dispute.created
   ✅ charge.refunded
   ✅ payment_intent.payment_failed
   ```
5. Copy **Webhook Secret** → `STRIPE_WEBHOOK_SECRET`
6. Save endpoint

### 1.3 - Configure Products & Plans

**Existing Plans in Code** (`server/config/plans.ts`):

```typescript
export const SERVER_PLANS = {
  free: {
    name: "Free",
    amount: 0,
    interval: "month",
    currency: "usd"
  },
  pro_monthly: {
    name: "Pro Monthly",
    amount: 99.99,
    interval: "month",
    currency: "usd"
  },
  premium_monthly: {
    name: "Premium Monthly",
    amount: 199.99,
    interval: "month",
    currency: "usd"
  }
};
```

**Create in Stripe Dashboard** (https://dashboard.stripe.com/products):

For each plan:
1. Click "Create product"
2. Name: (e.g. "Pro Monthly")
3. Price: Set recurring monthly price
4. Save product ID
5. Update `server/config/plans.ts` with Stripe product IDs:

```typescript
export const SERVER_PLANS = {
  pro_monthly: {
    ...
    stripeProductId: "prod_...",
    stripePriceId: "price_..."
  }
};
```

---

## Part 2: Environment Variables

### 2.1 - Production `.env`

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx...

# API Base URL
APP_BASE_URL=https://api.lingolive.com

# Firebase
FIREBASE_PROJECT_ID=lingolive-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Node Environment
NODE_ENV=production
```

### 2.2 - Verify Environment

**Staging (test before prod)**:
```bash
# Use test keys from Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx...
```

---

## Part 3: Local Testing with Stripe CLI

### 3.1 - Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl https://files.stripe.com/stripe-cli/install.sh -O
bash ./install.sh

# Windows
choco install stripe-cli

# Verify
stripe version
```

### 3.2 - Configure Stripe CLI

```bash
# Login to Stripe account
stripe login

# Create new webhook listener
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Save the signing secret (whsec_...)
# This becomes your local STRIPE_WEBHOOK_SECRET
```

### 3.3 - Test Webhook Events

**In another terminal**:

```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed \
  --override metadata='userId=test-user-123,planId=pro_monthly'

# Test invoice.paid
stripe trigger invoice.paid \
  --override customer=cus_test123 \
  --override amount_paid=9999

# Test invoice.payment_failed
stripe trigger invoice.payment_failed \
  --override attempt_count=1

# Test customer.subscription.updated
stripe trigger customer.subscription.updated \
  --override status=active

# Test customer.subscription.deleted
stripe trigger customer.subscription.deleted

# Test charge.dispute.created
stripe trigger charge.dispute.created \
  --override reason=fraudulent

# Test charge.refunded
stripe trigger charge.refunded \
  --override amount_refunded=9999

# Test payment_intent.payment_failed
stripe trigger payment_intent.payment_failed
```

### 3.4 - Verify Webhook Processing

**Check logs**:
```bash
# Terminal 1 (webhook listener)
# Should show: [Stripe Webhook Event] Processing event: checkout.session.completed ...

# Terminal 2 (app server)
npm run dev
# Should show: [Payment Route] Creating checkout session...
# Should show: [Stripe Webhook] ✅ Event evt_... processed successfully
```

---

## Part 4: Automated Testing

### 4.1 - Run Test Suite

```bash
# Run Stripe webhook tests
npm run test server/routes/__tests__/payment.webhook.test.ts

# Run all tests with coverage
npm run test:ci

# Expected output:
# ✓ server/routes/__tests__/payment.webhook.test.ts (15 tests)
#   ✓ checkout.session.completed
#   ✓ invoice.payment_failed
#   ✓ customer.subscription.updated
#   ... etc
```

### 4.2 - Integration Test Checklist

- [ ] Create subscription → verify webhook fires
- [ ] Payment succeeds → verify access granted
- [ ] Payment fails → verify retry scheduled
- [ ] Invoice renewal → verify subscription extended
- [ ] Subscription cancelled → verify access revoked
- [ ] Chargeback initiated → verify flagged for review

---

## Part 5: Staging Deployment

### 5.1 - Deploy to Staging Environment

```bash
# Build
npm run build

# Deploy to staging Cloud Run instance
gcloud run deploy lingolive-server-staging \
  --image gcr.io/lingolive-staging/server:latest \
  --set-env-vars \
    STRIPE_SECRET_KEY=sk_test_... \
    STRIPE_WEBHOOK_SECRET=whsec_test_... \
    NODE_ENV=staging

# Get staging URL
gcloud run services describe lingolive-server-staging \
  --format='value(status.url)'
```

### 5.2 - Test in Staging

```bash
# Update Stripe webhook to point to staging
# https://dashboard.stripe.com/webhooks → Edit → URL

# Test full payment flow:
1. Create Stripe test subscription
2. Complete mock payment
3. Verify webhook received
4. Check user subscription status in Firebase
5. Simulate payment failure
6. Verify retry scheduled
```

---

## Part 6: Production Deployment

### 6.1 - Switch to Live Keys

```bash
# Update .env.production with LIVE keys (not test keys)
STRIPE_SECRET_KEY=sk_live_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
```

### 6.2 - Deploy to Production

```bash
# Build with production config
npm run build

# Deploy to production
gcloud run deploy lingolive-server \
  --image gcr.io/lingolive-prod/server:v1.0.0 \
  --set-env-vars \
    STRIPE_SECRET_KEY=sk_live_... \
    STRIPE_WEBHOOK_SECRET=whsec_... \
    NODE_ENV=production

# Verify deployment
gcloud run services describe lingolive-server \
  --format='value(status.url)'
```

### 6.3 - Update Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Update webhook endpoint URL to production: `https://api.lingolive.com/api/stripe-webhook`
3. Select "Test Webhook" → trigger one event to verify connectivity

---

## Part 7: Monitoring & Alerts

### 7.1 - Setup Logging

**Cloud Logging Queries**:

```yaml
# Stripe webhook errors
resource.type="cloud_run_revision"
labels.service_name="lingolive-server"
jsonPayload.message=~"Stripe Webhook.*Error"

# Payment processing
jsonPayload.message=~"\[Stripe Webhook\].*Processing"

# Dead letter queue
jsonPayload.message=~"exceeded max retries"
```

### 7.2 - Setup Alerts

**Create alerts in Cloud Monitoring**:

```yaml
# Alert 1: Webhook failures
Condition: Cloud Logging > rate of "Webhook.*Error" > 5/min
Action: Email ops@lingolive.com

# Alert 2: Dead letter queue growth
Condition: Firestore doc count(webhook_dead_letters) > 10
Action: Email ops@lingolive.com + PagerDuty

# Alert 3: Payment processing latency
Condition: Cloud Trace > p95 latency > 5s
Action: Email eng@lingolive.com
```

### 7.3 - Regular Monitoring Tasks

**Daily**:
- [ ] Check for webhook errors in Cloud Logging
- [ ] Review dead letter queue (should be empty)
- [ ] Verify all payments processing correctly

**Weekly**:
- [ ] Run Stripe reconciliation (count local vs Stripe subscriptions)
- [ ] Review dispute/chargeback rates
- [ ] Check payment success rates

**Monthly**:
- [ ] Audit subscription changes
- [ ] Review refund patterns
- [ ] Update monitoring thresholds

---

## Part 8: Troubleshooting

### Issue: Webhook Not Received

**Debugging**:
```bash
# Check Stripe webhook delivery logs
# https://dashboard.stripe.com/webhooks → Select endpoint → View logs

# Check Cloud Logging
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Test connectivity
curl -X POST https://api.lingolive.com/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test","id":"evt_test"}'
```

### Issue: Payment Not Updating User Access

**Debug Checklist**:
1. [ ] User exists in Firebase (`users/{uid}`)
2. [ ] `stripeCustomerId` set in user profile
3. [ ] Payment event has `userId` in metadata
4. [ ] PaymentEngineService logs show `handlePaymentSuccess` called
5. [ ] User `subscriptionStatus` updated to "active"

### Issue: Duplicate Processing

**Solution**:
- WebhookRetryService uses event ID locking
- If seeing duplicates, check: `webhook_retries` collection
- Manually mark processed in `event_locks` collection

---

## Rollback Plan

If issues detected in production:

1. **Immediate** (< 5 min):
   ```bash
   # Disable webhook endpoint temporarily
   # https://dashboard.stripe.com/webhooks → Disable
   
   # Route traffic to previous Cloud Run revision
   gcloud run services update-traffic lingolive-server --to-revisions PREVIOUS=100
   ```

2. **Short term** (5-60 min):
   - Fix bug in code
   - Deploy patched version
   - Re-enable webhook endpoint
   - Manually process any missed webhooks from dead letter queue

3. **Long term**:
   - Post-mortem analysis
   - Add additional monitoring
   - Update test coverage

---

## Success Criteria

✅ **Production Ready when**:

- [ ] All webhook events tested with Stripe CLI
- [ ] 100% of webhook test cases passing
- [ ] Zero errors in staging Cloud Logging
- [ ] First 10 real payments process successfully
- [ ] Webhook latency < 2s (p95)
- [ ] Dead letter queue remains empty for 48h
- [ ] Admin dashboard shows all payments correctly
- [ ] Documentation complete & team trained

---

## Support & Escalation

**Common Questions**:

**Q: Can I test live payments?**  
A: Use test card numbers: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)

**Q: How often do webhooks retry?**  
A: Stripe retries for 3 days; we add exponential backoff (2s, 4s, 8s)

**Q: What if Stripe goes down?**  
A: Webhooks will be delayed; we'll receive them when Stripe recovers. Check `/webhook_retries` collection for pending events.

**Q: Can I process a webhook manually?**  
A: Yes, call `PaymentEngineService.handlePaymentSuccess({...})` directly with same payload

---

**Responsible Team**: Backend Engineering  
**Slack Channel**: #payments-engineering  
**On-Call Rotation**: See PagerDuty  
**Contact**: ops@lingolive.com

