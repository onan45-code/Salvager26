const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { Expo } = require("expo-server-sdk");

admin.initializeApp();

// Twilio API Key auth — used by phone OTP verification only
const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_API_KEY_SID = defineSecret("TWILIO_API_KEY_SID");
const TWILIO_API_KEY_SECRET = defineSecret("TWILIO_API_KEY_SECRET");
const TWILIO_VERIFY_SERVICE_SID = defineSecret("TWILIO_VERIFY_SERVICE_SID");

// Twilio Auth Token — kept for reference, notifications now use AWS SNS
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

// AWS SNS — SMS notifications (replaces Twilio 10DLC)
const AWS_ACCESS_KEY_ID = defineSecret("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");
const AWS_SNS_REGION = defineSecret("AWS_SNS_REGION");

function trimmed(secret) {
  return (secret.value() || "").trim();
}

function verifyClient() {
  return twilio(
    trimmed(TWILIO_API_KEY_SID),
    trimmed(TWILIO_API_KEY_SECRET),
    { accountSid: trimmed(TWILIO_ACCOUNT_SID) }
  );
}

async function sendSms(phone, message) {
  const to = normalizePhone(phone);
  if (!to) return false;
  try {
    const client = twilio(trimmed(TWILIO_ACCOUNT_SID), trimmed(TWILIO_AUTH_TOKEN));
    await client.messages.create({ from: trimmed(TWILIO_FROM_NUMBER), to, body: message });
    return true;
  } catch (e) {
    logger.error("Twilio SMS failed", { to, error: e.message });
    return false;
  }
}

async function sendSnsSms(phone, message) {
  const to = normalizePhone(phone);
  if (!to) return false;
  try {
    const client = new SNSClient({
      region: trimmed(AWS_SNS_REGION) || "us-east-1",
      credentials: {
        accessKeyId: trimmed(AWS_ACCESS_KEY_ID),
        secretAccessKey: trimmed(AWS_SECRET_ACCESS_KEY),
      },
    });
    await client.send(new PublishCommand({
      Message: message,
      PhoneNumber: to,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": { DataType: "String", StringValue: "Transactional" },
      },
    }));
    return true;
  } catch (e) {
    logger.error("AWS SNS SMS failed", { to, error: e.message });
    return false;
  }
}

const EXPO_PROJECT_ID = "aa722540-034a-4737-9e73-1efc9e4dd59c";
const expoClient = new Expo({ projectId: EXPO_PROJECT_ID });

async function sendPushNotification(pushToken, title, body) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return false;
  try {
    const chunks = expoClient.chunkPushNotifications([{ to: pushToken, sound: "default", title, body }]);
    for (const chunk of chunks) {
      await expoClient.sendPushNotificationsAsync(chunk);
    }
    return true;
  } catch (e) {
    logger.error("Push notification failed", { pushToken, error: e.message });
    return false;
  }
}

// Send push + SMS in parallel; either channel failing doesn't block the other
async function notifyUser(user, pushTitle, smsMessage) {
  const canPush = !!user.pushToken;
  const canSms = !!(user.smsConsent && user.smsNotifications && user.phone);
  if (!canPush && !canSms) return { pushSent: false, smsSent: false };
  const results = await Promise.allSettled([
    canPush ? sendPushNotification(user.pushToken, pushTitle, smsMessage) : Promise.resolve(false),
    canSms ? sendSnsSms(user.phone, smsMessage) : Promise.resolve(false),
  ]);
  return {
    pushSent: results[0].status === "fulfilled" && results[0].value === true,
    smsSent: results[1].status === "fulfilled" && results[1].value === true,
  };
}

exports.sendPhoneVerification = onCall(
  {
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_VERIFY_SERVICE_SID],
  },
  async (request) => {
    const phone = normalizePhone((request.data || {}).phoneNumber);
    if (!phone) {
      throw new HttpsError("invalid-argument", "Invalid phone number format");
    }
    try {
      const verification = await verifyClient().verify.v2
        .services(trimmed(TWILIO_VERIFY_SERVICE_SID))
        .verifications.create({ to: phone, channel: "sms" });
      return { success: true, status: verification.status };
    } catch (e) {
      logger.error("sendPhoneVerification failed", { phone, code: e.code, message: e.message });
      if (e.status === 429 || e.code === 60203) {
        throw new HttpsError("resource-exhausted", "Too many attempts. Please wait a few minutes and try again.");
      }
      throw new HttpsError("internal", "Couldn't send verification code. Please try again.");
    }
  }
);

exports.checkPhoneVerification = onCall(
  {
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_VERIFY_SERVICE_SID],
  },
  async (request) => {
    const { phoneNumber, code } = request.data || {};
    const phone = normalizePhone(phoneNumber);
    if (!phone) {
      throw new HttpsError("invalid-argument", "Invalid phone number format");
    }
    if (!code || typeof code !== "string") {
      throw new HttpsError("invalid-argument", "Code is required");
    }
    let check;
    try {
      check = await verifyClient().verify.v2
        .services(trimmed(TWILIO_VERIFY_SERVICE_SID))
        .verificationChecks.create({ to: phone, code });
    } catch (e) {
      logger.error("checkPhoneVerification failed", { phone, code: e.code, message: e.message });
      if (e.status === 429 || e.code === 60202) {
        throw new HttpsError("resource-exhausted", "Too many attempts. Please wait a few minutes and try again.");
      }
      throw new HttpsError("internal", "Couldn't verify code. Please try again.");
    }
    if (check.status !== "approved") {
      return { approved: false, status: check.status };
    }
    if (request.auth && request.auth.uid) {
      try {
        const usersSnap = await admin.firestore()
          .collection("users")
          .where("uid", "==", request.auth.uid)
          .limit(1)
          .get();
        if (!usersSnap.empty) {
          await usersSnap.docs[0].ref.update({
            phone,
            phoneVerified: true,
            phoneVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (e) {
        logger.error("checkPhoneVerification doc update failed", { uid: request.auth.uid, message: e.message });
      }
    }
    return { approved: true };
  }
);

// New listing created → push + SMS fanout to buyers whose preferences match
exports.onListingCreate = onDocumentCreated(
  {
    document: "listings/{listingId}",
    secrets: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SNS_REGION],
  },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;
    if (listing.status === "deleted") return;

    const usersSnap = await admin.firestore().collection("users").get();
    const zipCache = {};
    const listingCoords = await getZipCoords(listing.zip, zipCache);

    let sent = 0;
    let skipped = 0;

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();

      if (u.uid === listing.sellerId) { skipped++; continue; }
      if (u.role === "seller") { skipped++; continue; }

      const canPush = !!u.pushToken;
      const canSms = !!(u.smsConsent && u.smsNotifications && u.phone);
      if (!canPush && !canSms) { skipped++; continue; }

      const prefs = u.buyingPreferences;
      if (!prefs || !prefs.zip) { skipped++; continue; }
      if (Array.isArray(prefs.makes) && prefs.makes.length > 0 && !prefs.makes.includes(listing.make)) { skipped++; continue; }

      const yr = parseInt(listing.year) || 0;
      if (prefs.yearFrom && yr < parseInt(prefs.yearFrom)) { skipped++; continue; }
      if (prefs.yearTo && yr > parseInt(prefs.yearTo)) { skipped++; continue; }
      if (prefs.runsOnly && listing.runs !== true) { skipped++; continue; }
      if (prefs.cleanTitleOnly && listing.titleStatus !== "clean") { skipped++; continue; }

      const radius = parseFloat(prefs.radius || "99999");
      if (radius < 99999) {
        if (!listingCoords) { skipped++; continue; }
        const userCoords = await getZipCoords(prefs.zip, zipCache);
        if (!userCoords) { skipped++; continue; }
        if (haversineMiles(userCoords, listingCoords) > radius) { skipped++; continue; }
      }

      const message = `New on Salvager: ${listing.year} ${listing.make} ${listing.model}${listing.city ? " in " + listing.city : ""}. Open the app to see details.`;
      const { pushSent, smsSent } = await notifyUser(u, "New listing on Salvager", message);
      if (pushSent || smsSent) sent++; else skipped++;
    }

    logger.info("Listing notification fanout", { listingId: event.params.listingId, sent, skipped });
  }
);

// Bid placed → push + SMS to seller
exports.onBidCreate = onDocumentCreated(
  {
    document: "bids/{bidId}",
    secrets: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SNS_REGION],
  },
  async (event) => {
    const bid = event.data?.data();
    if (!bid) return;

    try {
      const listingDoc = await admin.firestore().collection("listings").doc(bid.listingId).get();
      if (!listingDoc.exists) return;
      const listing = listingDoc.data();

      if (listing.sellerId && bid.buyerId && listing.sellerId === bid.buyerId) {
        logger.warn("Self-bid rejected", {
          bidId: event.params.bidId,
          sellerId: listing.sellerId,
          buyerId: bid.buyerId,
          buyerEmail: bid.buyerEmail,
          amount: bid.amount,
        });
        await event.data.ref.delete();
        return;
      }

      const sellerSnap = await admin.firestore().collection("users")
        .where("uid", "==", listing.sellerId).limit(1).get();
      if (sellerSnap.empty) return;
      const seller = sellerSnap.docs[0].data();

      if (!seller.pushToken && (!seller.smsConsent || !seller.phone)) {
        logger.info("Bid placed notification skipped — no push token or SMS consent", { bidId: event.params.bidId, sellerUid: listing.sellerId });
        return;
      }

      const message = `New bid on Salvager! $${bid.amount} offered for your ${listing.year} ${listing.make} ${listing.model}. Open the app to review.`;
      const { pushSent, smsSent } = await notifyUser(seller, "New bid on your listing", message);

      logger.info("Bid placed notification sent", { bidId: event.params.bidId, sellerUid: listing.sellerId, pushSent, smsSent });
    } catch (e) {
      logger.error("onBidCreate error", { error: e.message });
    }
  }
);

// Bid accepted → push + SMS to buyer
exports.onBidUpdate = onDocumentUpdated(
  {
    document: "bids/{bidId}",
    secrets: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SNS_REGION],
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    if (before.status === "accepted" || after.status !== "accepted") return;

    try {
      const listingDoc = await admin.firestore().collection("listings").doc(after.listingId).get();
      const listing = listingDoc.exists ? listingDoc.data() : {};

      const buyerSnap = await admin.firestore().collection("users")
        .where("uid", "==", after.buyerId).limit(1).get();
      if (buyerSnap.empty) return;
      const buyer = buyerSnap.docs[0].data();

      if (!buyer.pushToken && (!buyer.smsConsent || !buyer.phone)) {
        logger.info("Bid accepted notification skipped — no push token or SMS consent", { bidId: event.params.bidId, buyerUid: after.buyerId });
        return;
      }

      const vehicle = listing.year && listing.make
        ? `${listing.year} ${listing.make} ${listing.model}`
        : "the vehicle";
      const message = `Your $${after.amount} bid on Salvager was accepted! Open the app for seller contact info on the ${vehicle}.`;
      const { pushSent, smsSent } = await notifyUser(buyer, "Your bid was accepted!", message);

      logger.info("Bid accepted notification sent", { bidId: event.params.bidId, buyerUid: after.buyerId, pushSent, smsSent });
    } catch (e) {
      logger.error("onBidUpdate error", { error: e.message });
    }
  }
);

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

async function getZipCoords(zip, cache) {
  if (!zip) return null;
  if (cache[zip] !== undefined) return cache[zip];
  try {
    const r = await fetch("https://api.zippopotam.us/us/" + zip);
    if (!r.ok) { cache[zip] = null; return null; }
    const data = await r.json();
    const coords = {
      lat: parseFloat(data.places[0].latitude),
      lng: parseFloat(data.places[0].longitude),
    };
    cache[zip] = coords;
    return coords;
  } catch (e) {
    cache[zip] = null;
    return null;
  }
}

// Pre-signup email availability check. Called BEFORE phone verification
// so users learn their email is taken without burning an SMS / their time.
exports.checkEmailExists = onCall(async (request) => {
  const email = String((request.data || {}).email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Invalid email");
  }
  try {
    await admin.auth().getUserByEmail(email);
    return { exists: true };
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      return { exists: false };
    }
    logger.error("checkEmailExists failed", { email, code: e.code, message: e.message });
    throw new HttpsError("internal", "Couldn't check email. Please try again.");
  }
});

function haversineMiles(a, b) {
  const R = 3958.8;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

