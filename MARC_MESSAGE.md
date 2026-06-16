# Message for Marc — June 16, 2026

---

**Hey Marc!**

Yes — that rotation request came from me, totally legitimate. And honestly, your Claude Code response was exactly right. Holding off, explaining why it couldn't proceed, and flagging it to you to verify with me first — that's exactly what it should do when something touches live credentials. Good instinct on your part to ask.

Here's what actually happened: the file (`Marc_aws_rotation_prompt.md`) was pushed to GitHub but you hadn't run `git pull` yet, so Claude Code couldn't find it. And even if it had found it, your Claude Code was correct — doing this properly needs admin AWS access that lives on my side, not yours. That script was written assuming I'd be there to do it, which I wasn't. My mistake for not making that clearer.

**What I'm doing:**

I'm handling the full rotation myself — no action needed from you. Safe order:

1. Create new IAM user with publish-only access
2. Load new key into Firebase secrets
3. Redeploy functions
4. Test that SMS actually sends
5. Only then delete the old key

I'll let you know when it's done and tested.

**Salvager26 build:**

Your app changes (home-screen stat boxes, Purchases section, VIN on listings, delete sold vehicles, sort fix) are pulled and ready. I'll build and submit this week.

**TitleReady:**

Everything for v1.0.1 is in the repo. Open TitleReady in Claude Code and paste this:

> Pull the latest code (`git pull origin main`), run `npm install`, then build and submit both platforms: `eas build --platform all --profile production`, then `eas submit --platform ios --profile production` and `eas submit --platform android --profile production`. Tell me the EAS credit cost before starting and wait for my OK.

Questions? oleksiyalex3@gmail.com

**Alex**

---
