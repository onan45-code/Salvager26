# Message for Marc — June 16, 2026

---

**Hey Marc!**

That rotation request was from me — totally legitimate. And your Claude Code was exactly right to hold off. Good instinct on both counts.

Quick clarification on the account confusion: the IAM user `oleksiy-salvager` and that key live in **your** AWS account (Carsmart Inc), not mine. I created the user during our Zoom call while you were logged into your AWS Console. I don't have your AWS admin credentials on my end, so I can't go into your account and create a new user myself — that's why the split is necessary.

---

**AWS key rotation — what you need to do (browser, ~5 min):**

1. Sign in to **your** AWS account → **IAM → Users → Create user**
2. Name: `salvager26-sns`
3. Permissions → Attach policies directly → **Create policy** → JSON tab → paste this exactly:

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

Name the policy `salvager26-sns-publish` → attach it → finish creating the user.

4. Open the new user → **Security credentials** → **Create access key** → "Application running outside AWS"
5. **Send me the Access Key ID and Secret Access Key** — oleksiyalex3@gmail.com (or message me here)

**I handle everything after that:** load the new key into Firebase secrets, redeploy the functions, send a test SMS, and confirm it works. Once I give you the green light, you go back to AWS → IAM → Users → `oleksiy-salvager` → Security credentials → find key `AKIAZD2ZSL3MNQNWCHUS` → **Delete**. That last step only after I confirm, not before — otherwise the app stops sending texts to users between the two keys.

---

**What's ready in the apps:**

**Salvager26** — your UI changes (home-screen stat boxes, Purchases section, VIN on listings, delete sold vehicles, sort fix — commit `e6c2b2c`) are in the repo and ready to build whenever you want.

**TitleReady v1.0.1** — fresh engine push today. The AI now handles:
- **Repossession titles:** detects when the lienholder (not the registered owner) signed the title over — flags it as valid but shows the DR 2393 (Statement of Repossession) link the buyer needs
- **Name variation vs. open title:** distinguishes a marriage/divorce name change (same first name, different last → DR 2421 link) from a genuinely different person (open title → rejected)
- **Both salvage brands now get DR 2710 message** — that was missing from plain Salvage titles before
- **Older DR-2001 layout (your concern from 6/15):** prompt is now label-based instead of position-based, so it handles the older 6/00 revision format that was hurting accuracy

To build v1.0.1, open TitleReady in Claude Code and paste:

> Pull the latest code (`git pull origin main`), run `npm install`, then build and submit both platforms: `eas build --platform all --profile production`, then `eas submit --platform ios --profile production` and `eas submit --platform android --profile production`. Tell me the EAS credit cost before starting and wait for my OK.

---

Questions? oleksiyalex3@gmail.com

**Alex**

---
