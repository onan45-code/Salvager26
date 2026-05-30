# Marc Zelinka — Salvager App Owner Config v1.0

**Updated:** May 2026
**App:** Salvager — car salvage marketplace (iOS + Android)
**Developer on file:** Alex K — oleksiyalex3@gmail.com

---

## Who Marc Is

Marc is the **owner** of the Salvager app, not a developer. He manages the business side — listings, users, App Store, Google Play. When Marc opens Claude Code, he needs plain-English guidance with exact steps and button names. No jargon. No assumptions.

---

## App Identifiers (Use These Everywhere)

| | |
|---|---|
| **iOS App Store ID** | 6771887215 |
| **iOS Bundle ID** | com.magamarc.CashForCars |
| **Android Package** | com.carsmart.salvager |
| **Apple Team ID** | D7N7558TTP |
| **Expo Account** | salvager |
| **EAS Project ID** | 18869e4c-6b58-4fc4-9f62-f2db1a843952 |
| **Firebase Project** | salvager26 |
| **GitHub Repo** | github.com/onan45-code/Salvager26 |

---

## Rules When Helping Marc

1. **Plain English only** — if you must use a technical term, explain it in parentheses immediately
2. **One step at a time** — never give Marc a numbered list of 10 things; walk through one, confirm, then next
3. **Name the button exactly** — say "Click the blue + button in the top-right corner", not "create a new key"
4. **Show before doing** — for any code change, show what will change and wait for Marc to say OK
5. **Never delete data** — listings are soft-deleted only (status = "deleted"), never removed from database
6. **Alert before spending money** — builds cost EAS credits; always confirm before starting a build
7. **When stuck, tell Marc what to send Alex** — give him the exact copy-paste message

---

## Common Tasks

### "Submit the app to the App Store (iOS)"

**Step 1 — Find the latest build:**
Run: `eas build:list --platform ios --status finished --limit 3`
Show Marc the build date and version number.

**Step 2 — Check for API key:**
Ask: "Do you have a Team API Key .p8 file? If yes, where is it saved?"
- If yes, proceed to Step 3
- If no, go to **"Generate App Store Connect Team API Key"** task below

**Step 3 — Submit:**
Run: `eas submit --platform ios --profile production --latest`
Watch for errors. If it says 401 or "not authorized", the API key is expired — go to the Generate task.

---

### "Submit the app to Google Play (Android)"

**Step 1 — Find the latest build:**
Run: `eas build:list --platform android --status finished --limit 3`

**Step 2 — Submit:**
Run: `eas submit --platform android --profile production --latest`

If it fails, copy the error message and send it to Alex.

---

### "Generate App Store Connect Team API Key" (Marc must do this — he's Account Holder)

Walk Marc through these steps one at a time, waiting for confirmation after each:

1. Open Safari or Chrome → go to **appstoreconnect.apple.com** → sign in
2. Click **Users and Access** in the top navigation bar
3. Click the **Integrations** tab
4. In the left sidebar, click **App Store Connect API**
5. Click the **Team Keys** tab (important — NOT Individual Keys)
   - If you see "An error has occurred. Try again later." — wait 30 minutes and try again, or contact Apple Developer Support
6. Click the blue **+** button (top right of the keys table)
7. Fill in: **Name:** `EAS Submit` | **Access:** select `App Manager`
8. Click **Generate**
9. On the next screen, write down:
   - **Key ID** (10 characters, e.g. `ABC123DEF4`)
   - **Issuer ID** (looks like `69a6de94-b7c0-47e3-e053-5b8c7c11a4d1`)
10. Click **Download API Key** — saves to your Downloads folder as a `.p8` file
    ⚠️ **Apple only lets you download this file once. Do not close the page until it's downloaded.**
11. Email Alex: oleksiyalex3@gmail.com
    - Attach the `.p8` file
    - Include the Key ID and Issuer ID in the email body

---

### "Build the app"

Ask Marc: "iOS, Android, or both?"

Then confirm: "This will use EAS build credits. Ready to start?"

Run:
- iOS: `eas build --platform ios --profile production`
- Android: `eas build --platform android --profile production`
- Both: `eas build --platform all --profile production`

Build takes 15–30 minutes in the cloud. Marc can close the terminal.
Check status: expo.dev/accounts/salvager/projects/CashForCars/builds

---

### "Apple rejected the app"

Ask Marc to paste the full rejection message from App Store Connect.
Explain in plain English what Apple wants.
If it needs a code change — describe what will change, get Marc's OK, then make the change.
Always commit and push to GitHub after any code change.

---

### "I want to change something in the app"

Ask:
1. Which screen? (e.g. Login screen, Browse Cars, Create Listing)
2. What should it do that it doesn't do now?
3. How should it look?

Then: find the code in App.js, show Marc the before/after, wait for OK, then make the change.

---

## What Marc Can Do vs. What Needs Alex

| Task | Who Does It |
|------|-------------|
| Generate App Store Connect Team API Key | **Marc** (Account Holder only) |
| Submit build to App Store / Google Play | Marc (with Claude Code) or Alex |
| Build the app | Marc (with Claude Code) or Alex |
| Change app code | Alex (or Claude Code if Marc approves each change) |
| Firebase database changes | Alex |
| Google Play new app creation | Alex |
| Twilio / SMS setup | Alex |

---

## Emergency: Send This to Alex

When stuck, Marc can send Alex this message template:

> Hi Alex, I'm having an issue with [describe problem].
> Here is the error: [paste exact error]
> I already tried: [what Claude Code suggested]
> Can you take a look?
>
> oleksiyalex3@gmail.com

---

*Config version: 1.0 | Last updated: May 2026 | Maintained by: Alex K*
