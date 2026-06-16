# Message for Marc — June 16, 2026

---

**Hey Marc!**

Yes — that rotation request came from me, totally legitimate. And your Claude Code was exactly right to hold off and flag it. Good instinct.

Here's what actually happened: the file it referenced was pushed to GitHub but you hadn't run `git pull` yet, so Claude Code couldn't find it. Either way — you're right that this needs to be done carefully.

---

**AWS key rotation — split between us:**

You do the AWS Console part (browser, 5 min):

1. Sign in to your AWS account → **IAM → Users → Create user**
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
5. **Send me the Access Key ID and Secret Access Key** — oleksiyalex3@gmail.com

I do the rest: load the new key into Firebase, redeploy, confirm SMS sends, then you go back to AWS and delete the old key (`AKIAZD2ZSL3MNQNWCHUS` on user `oleksiy-salvager`). That last step only after I confirm the new one works.

---

**Salvager26 build:**

Your app changes (home-screen stat boxes, Purchases section, VIN on listings, delete sold vehicles, sort fix) are ready — building this week.

---

**TitleReady:**

Everything for v1.0.1 is in the repo. Open TitleReady in Claude Code and paste this:

> Pull the latest code (`git pull origin main`), run `npm install`, then build and submit both platforms: `eas build --platform all --profile production`, then `eas submit --platform ios --profile production` and `eas submit --platform android --profile production`. Tell me the EAS credit cost before starting and wait for my OK.

---

Questions? oleksiyalex3@gmail.com

**Alex**

---
