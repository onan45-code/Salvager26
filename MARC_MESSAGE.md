# Message for Marc — Salvager26 SMS Fix (June 2026)

---

**Hey Marc!**

Good news — the Twilio loop is over. Here's what I've done and what happens next.

---

**The problem (Twilio)**

The A2P 10DLC registration is a dead end for small apps. Carriers keep rejecting new registrations for apps with low message volume. Resubmitting won't help — stop doing that.

---

**Plan B: Amazon SNS**

I've updated the Salvager26 Cloud Functions to use Amazon SNS for SMS. It's the same thing Twilio claims to do but with AWS handling the carrier routing directly. For a small app like Salvager, it works immediately after setup, no brand/campaign registration required for testing.

Cost: roughly $0.0075 per SMS to US numbers — nearly the same as Twilio.

What users will see: messages come from an AWS 10-digit number (similar to what Twilio would have shown).

---

**What also improved: push notifications**

Bid notifications (new bid, bid accepted, listing match) now fire from the server — not just from the buyer's phone. This means notifications arrive even if the buyer goes offline right after bidding. More reliable overall.

---

**What needs to happen before this goes live (Alex is handling this):**

1. AWS account + IAM user setup (Alex)
2. Three secrets set in Firebase (Alex)
3. Functions deployed (Alex runs `npm install` + `firebase deploy --only functions --project salvager26`)

Twilio Verify (the phone verification code when you sign up) stays the same — that part works fine.

---

**Timeline:** Alex can have this live same day once the AWS account is set up.

Questions? oleksiyalex3@gmail.com

**Alex**

---
