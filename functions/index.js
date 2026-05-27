const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

// Twilio API Key auth — used by phone OTP verification only
const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_API_KEY_SID = defineSecret("TWILIO_API_KEY_SID");
const TWILIO_API_KEY_SECRET = defineSecret("TWILIO_API_KEY_SECRET");
const TWILIO_VERIFY_SERVICE_SID = defineSecret("TWILIO_VERIFY_SERVICE_SID");

// Twilio Auth Token — used for SMS notifications
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

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

// New listing created → SMS fanout to buyers whose preferences match
exports.onListingCreate = onDocumentCreated(
  {
    document: "listings/{listingId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
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
      if (!u.smsConsent) { skipped++; continue; }
      if (!u.smsNotifications) { skipped++; continue; }
      if (!u.phone) { skipped++; continue; }

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
      const ok = await sendSms(u.phone, message);
      if (ok) sent++; else skipped++;
    }

    logger.info("Listing notification fanout", { listingId: event.params.listingId, sent, skipped });
  }
);

// Bid placed → SMS to seller
exports.onBidCreate = onDocumentCreated(
  {
    document: "bids/{bidId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
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
      if (!seller.phone) return;
      if (!seller.smsConsent) {
        logger.info("Bid placed SMS skipped — no SMS consent", { bidId: event.params.bidId, sellerUid: listing.sellerId });
        return;
      }

      const message = `New bid on Salvager! $${bid.amount} offered for your ${listing.year} ${listing.make} ${listing.model}. Open the app to review.`;
      await sendSms(seller.phone, message);

      logger.info("Bid placed SMS sent", { bidId: event.params.bidId, sellerUid: listing.sellerId });
    } catch (e) {
      logger.error("onBidCreate error", { error: e.message });
    }
  }
);

// Bid accepted → SMS to buyer
exports.onBidUpdate = onDocumentUpdated(
  {
    document: "bids/{bidId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
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
      if (!buyer.phone) return;
      if (!buyer.smsConsent) {
        logger.info("Bid accepted SMS skipped — no SMS consent", { bidId: event.params.bidId, buyerUid: after.buyerId });
        return;
      }

      const vehicle = listing.year && listing.make
        ? `${listing.year} ${listing.make} ${listing.model}`
        : "the vehicle";
      const message = `Your $${after.amount} bid on Salvager was accepted! Open the app for seller contact info on the ${vehicle}.`;
      await sendSms(buyer.phone, message);

      logger.info("Bid accepted SMS sent", { bidId: event.params.bidId, buyerUid: after.buyerId });
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

