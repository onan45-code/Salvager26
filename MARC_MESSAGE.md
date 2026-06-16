# Message for Marc — June 16, 2026

---

Hey Marc!

That request was from me — legitimate. Your Claude Code was right to hold off.

One thing to clarify: the IAM user `oleksiy-salvager` lives in **your** AWS account, not mine. I set it up during our Zoom call while you were logged in — I don't have your AWS admin credentials on my side, so you need to create the new one.

**You do (AWS Console, ~5 min):**

1. Sign in → IAM → Users → Create user → name: `salvager26-sns`
2. Attach policies → Create policy → JSON tab → paste:
```
{
  "Version": "2012-10-17",
  "Statement": [{"Effect":"Allow","Action":"sns:Publish","Resource":"*"}]
}
```
Name it `salvager26-sns-publish` → attach → finish.

3. Open the new user → Security credentials → Create access key → "Application running outside AWS"
4. Send me the Key ID + Secret — oleksiyalex3@gmail.com

I'll load it into Firebase, redeploy, confirm SMS sends. Once I give you the green light, you delete the old key (`AKIAZD2ZSL3MNQNWCHUS` on user `oleksiy-salvager`). Delete only after I confirm.

**TitleReady v1.0.1 — engine pushed today:**
- Repossession detection → DR 2393 link now lights up
- Name variation (marriage/divorce name change) → DR 2421; different person entirely → rejected
- Both Salvage and Rebuilt from Salvage now get the DR 2710 message
- Older DR-2001 layout: prompt is now label-based, not position-based — should fix the accuracy drop you flagged

To build, open TitleReady in Claude Code and paste:
> Pull latest (`git pull origin main`), run `npm install`, then `eas build --platform all --profile production` and submit both platforms. Tell me the EAS credit cost first and wait for my OK.

**Salvager26** — your UI changes are in the repo and ready to build whenever.

Alex

---
