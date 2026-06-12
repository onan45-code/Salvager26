# AWS SNS Setup — Salvager26 SMS

## What this does
Replaces Twilio 10DLC SMS notifications (new listing, bid placed, bid accepted) with AWS SNS.
Twilio Verify (phone OTP) is unchanged.

---

## Step 1 — AWS IAM User

1. Sign in to AWS Console → IAM → Users → Create user
2. Name: `salvager26-sns` (or any name)
3. Permissions: attach a **least-privilege inline policy** (do NOT use `AmazonSNSFullAccess`).
   On the Create-user permissions step choose "Attach policies directly" → "Create policy" → JSON tab, and paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowSnsSmsPublish",
         "Effect": "Allow",
         "Action": "sns:Publish",
         "Resource": "*"
       }
     ]
   }
   ```
   Name it `salvager26-sns-publish` and attach it to the user.
   (`Resource` must be `*` — SMS is published to a phone number, not a topic ARN, so it can't be scoped further. `sns:Publish` is the only action the app uses.)
4. Create user → Security credentials tab → Create access key
5. Choose "Application running outside AWS"
6. Save `Access key ID` and `Secret access key` — you'll only see the secret once

---

## Step 2 — AWS SNS SMS Sandbox

By default AWS SNS SMS starts in sandbox mode (can only send to verified numbers).

**For testing:**
- AWS Console → Amazon SNS → Text messaging (SMS) → Sandbox destination phone numbers
- Add your/Marc's phone number and verify it
- Test from there

**For production (send to any number):**
- AWS Console → Amazon SNS → Text messaging (SMS) → "Request to exit SMS sandbox"
- Fill in the form (company name: Carsmart Inc, use case: transactional notifications)
- AWS reviews within 24–48 hours — much faster than Twilio's process

Recommended region: `us-east-1` (most complete SNS feature set in the US)

---

## Step 3 — Set Firebase Secrets

```bash
firebase functions:secrets:set AWS_ACCESS_KEY_ID --project salvager26
# paste access key ID when prompted

firebase functions:secrets:set AWS_SECRET_ACCESS_KEY --project salvager26
# paste secret access key when prompted

firebase functions:secrets:set AWS_SNS_REGION --project salvager26
# type: us-east-1
```

---

## Step 4 — Install + Deploy

```bash
cd functions
npm install
firebase deploy --only functions --project salvager26
```

---

## Step 5 — Test

1. Have a test user with a verified sandbox number (or real number after sandbox exit)
2. Set `smsConsent: true` and `smsNotifications: true` on their user doc in Firestore
3. Create a listing → should get SMS + push notification
4. Check Firebase Functions logs for `AWS SNS SMS failed` or `smsSent: true`

---

## Notes

- `sendSms()` (Twilio notifications) is still in the code but no longer called for notifications
- `sendPhoneVerification` / `checkPhoneVerification` still use Twilio Verify — do not touch
- Push notifications now fire server-side (Cloud Functions) AND client-side (App.js) — this is intentional for reliability. Can remove App.js client-side push in a future cleanup.
- AWS SNS charges: ~$0.0075/SMS to US numbers. Check monthly spend in AWS Cost Explorer.

---

*Alex K — June 2026*
