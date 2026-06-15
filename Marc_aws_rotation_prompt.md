# Salvager26 — AWS SNS Credential Rotation (Claude Code)

## Context for Claude Code
You are Claude Code in Marc's environment. Task: rotate the AWS SNS credentials used by
the Salvager26 Cloud Functions to a new, dedicated, **publish-only** IAM user, and retire
the old access key. This applies the publish-only policy and refreshes the key in one pass.

**CRITICAL SECURITY RULE:** The new secret access key must NEVER be printed to the
terminal, written to a file, or shared in any chat. Capture it in a shell variable, pipe
it directly into the Firebase secret, then unset it. Never echo the secret.

---

## Step 0 — Preconditions (check first; if either fails, STOP and tell Marc to message Alex)
```bash
aws sts get-caller-identity      # must succeed with IAM permissions
firebase projects:list           # "salvager26" must appear in the list
```
If `salvager26` is not in the Firebase list, STOP — Marc doesn't have access to set the
secret, and we'll arrange it a different way. Do not continue.

---

## Step 1 — Create the new publish-only IAM user
```bash
aws iam create-user --user-name salvager26-sns

aws iam put-user-policy \
  --user-name salvager26-sns \
  --policy-name sns-publish-only \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"sns:Publish","Resource":"*"}]}'
```

## Step 2 — Generate the new key (do NOT print the secret)
Single call captures both values into variables — never echo NEW_SECRET:
```bash
read NEW_ID NEW_SECRET < <(aws iam create-access-key \
  --user-name salvager26-sns \
  --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)

echo "New key id: ${NEW_ID:0:4}****"   # confirms it worked without revealing the secret
```

## Step 3 — Set the Firebase secrets directly from the variables
```bash
printf '%s' "$NEW_ID"     | firebase functions:secrets:set AWS_ACCESS_KEY_ID     --project salvager26 --data-file -
printf '%s' "$NEW_SECRET" | firebase functions:secrets:set AWS_SECRET_ACCESS_KEY --project salvager26 --data-file -

unset NEW_ID NEW_SECRET   # wipe the values from the shell
```

## Step 4 — Redeploy functions so they pick up the new secret version
```bash
firebase deploy --only functions --project salvager26
```

## Step 5 — Retire the old (exposed) key
```bash
aws iam delete-access-key --user-name oleksiy-salvager --access-key-id AKIAZD2ZSL3MNQNWCHUS
```
*(Optional, later: if the `oleksiy-salvager` user has no other purpose, it can be deleted
entirely. Deleting the access key above is enough to neutralize the old credential.)*

## Step 6 — Test
Place a test bid in the app, then check the logs:
```bash
firebase functions:log --project salvager26 | grep -i sms
```
Look for `smsSent: true`. If SMS does not fire, tell Marc to send Alex the log output.

---

## If anything errors
Stop and send Alex: which step, the exact error, and what was tried. Do not retry the
destructive step (key deletion in Step 5) until the new key is confirmed working in Step 6.
```
Hey Alex — [step] failed: [error]. Tried: [what]. Hold on the old key deletion.
```

---
*Salvager26 maintenance — AWS SNS rotation — June 2026*