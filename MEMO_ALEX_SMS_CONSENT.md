# Memo for Alex — salvager.bid SMS consent fix

## TL;DR

salvager.bid currently has three pieces of bundled-consent language
that Twilio rejects. They need to be rewritten to make it clear that
SMS consent is **separate, optional, and collected inside the app /
during signup** — not automatic upon account creation.

No new form / checkbox is needed on salvager.bid itself (the page has
no signup form). The fix is rewording the existing disclosure copy.

## Background

Twilio compliance requires SMS consent to be collected as a separate,
explicit, optional opt-in. The website cannot state that consent is
granted automatically by creating an account or by agreeing to Terms.
Twilio audits the website language as well as the app.

The mobile app and Cloud Functions are already updated and deployed
(see "Matching changes already shipped" below) — salvager.bid is the
last remaining surface.

## What to change on salvager.bid

Three pieces of copy need to be replaced. Each currently reads
substantively as "by creating an account you agree to receive SMS",
which is the exact pattern Twilio prohibits.

### 1. Main body text

**Current:**

> By creating an account on Salvager, you agree to receive SMS
> messages from us at the phone number you provide.

**Replace with:**

> Salvager offers optional SMS notifications for account verification,
> bid alerts, and listing notifications. SMS messages are sent only to
> users who explicitly opt in by checking the SMS consent box during
> signup in the Salvager app, or by enabling SMS notifications in the
> app's Profile screen. Consent is not required to create an account
> or use Salvager. Message and data rates may apply. Message frequency
> varies based on activity. Reply STOP to opt out, HELP for help.

### 2. Privacy Policy section

**Current:**

> By providing your phone number and creating a Salvager account, you
> consent to receive SMS messages from us.

**Replace with:**

> SMS messages are sent only to users who have explicitly opted in to
> SMS notifications via the consent checkbox during signup or the SMS
> Notifications setting in their Profile. Providing a phone number for
> account verification does not by itself constitute consent to
> receive ongoing SMS notifications. Users may withdraw consent at any
> time by replying STOP to a Salvager message or by toggling SMS
> Notifications off in the app.

### 3. Terms of Service section

**Current:**

> By creating an account, you consent to receive SMS messages from
> Salvager related to your account, listings, and bids.

**Replace with:**

> Account creation does not enroll you in SMS notifications. SMS
> notifications (bid alerts, listing notifications) are sent only to
> users who have separately and explicitly opted in via the consent
> checkbox during signup or the SMS Notifications setting in the app.
> Account verification SMS messages (one-time passcodes during signup)
> are transactional and may be sent as a necessary part of the signup
> process regardless of SMS marketing consent. Users may opt out of
> ongoing SMS at any time by replying STOP or by toggling SMS
> Notifications off in the app.

## Key principles for any rewording

If you'd rather rephrase in your own voice, the language must satisfy
all of these:

- Must NOT claim consent is granted automatically by creating an
  account or by agreeing to Terms / Privacy
- Must make clear that SMS consent is separate, optional, and
  collected via an explicit affirmative action (the consent checkbox
  during in-app signup)
- May (and should) distinguish between transactional verification SMS
  (allowed without marketing consent) and ongoing notification SMS
  (requires consent)
- Must keep the required disclosures: message types, frequency, data
  rates, STOP/HELP instructions

## Matching changes already shipped on the app + backend

For consistency, the same pattern is already live in the mobile app
and Cloud Functions:

- **Mobile app signup** (`App.js`) — separate SMS consent checkbox,
  unchecked by default, with the exact disclosure label
- **Firestore user doc** — stores `smsConsent` (bool) and
  `smsConsentTimestamp` (server timestamp)
- **Cloud Functions** — all three SMS send paths (`onListingCreate`,
  `onBidCreate`, `onBidUpdate`) skip sending when `smsConsent !== true`
- **Profile screen banner** — existing users see a re-opt-in banner
  until they confirm consent
- **`public/sms-opt-in.html`** — already compliant standalone
  disclosure page; recently updated with both new-account and
  existing-account opt-in flows

Phone verification SMS (the 6-digit code at signup) is treated as
transactional and continues to send regardless of marketing consent —
this is allowed under Twilio policy and matches industry practice.

## Why this matters

Without the website fix, Twilio can keep flagging the number even
though the app + backend are now compliant — they audit all
user-facing surfaces, not just the app.
