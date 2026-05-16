// Deployed: 2026-05-15 — rebind to TWILIO_API_KEY_SID/SECRET v2
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_API_KEY_SID = defineSecret("TWILIO_API_KEY_SID");
const TWILIO_API_KEY_SECRET = defineSecret("TWILIO_API_KEY_SECRET");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");
const TWILIO_VERIFY_SERVICE_SID = defineSecret("TWILIO_VERIFY_SERVICE_SID");

function trimmed(secret) {
  return (secret.value() || "").trim();
}

function twilioClient() {
  return twilio(
    trimmed(TWILIO_API_KEY_SID),
    trimmed(TWILIO_API_KEY_SECRET),
    { accountSid: trimmed(TWILIO_ACCOUNT_SID) }
  );
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
      const verification = await twilioClient().verify.v2
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
      check = await twilioClient().verify.v2
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

exports.onListingCreate = onDocumentCreated(
  {
    document: "listings/{listingId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_FROM_NUMBER],
  },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;
    if (listing.status === "deleted") return;

    const client = twilio(
      TWILIO_API_KEY_SID.value(),
      TWILIO_API_KEY_SECRET.value(),
      { accountSid: TWILIO_ACCOUNT_SID.value() }
    );
    const fromNumber = trimmed(TWILIO_FROM_NUMBER);

    const usersSnap = await admin.firestore().collection("users").get();
    const zipCache = {};
    const listingCoords = await getZipCoords(listing.zip, zipCache);

    let sent = 0;
    let skipped = 0;

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();

      if (u.uid === listing.sellerId) { skipped++; continue; }
      if (u.role === "seller") { skipped++; continue; }
      if (!u.smsNotifications) { skipped++; continue; }

      const phone = normalizePhone(u.phone);
      if (!phone) { skipped++; continue; }

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

      const body = `New on Salvager: ${listing.year} ${listing.make} ${listing.model}${listing.city ? " in " + listing.city : ""}. Open the app to see details.`;

      try {
        await client.messages.create({ from: fromNumber, to: phone, body });
        sent++;
      } catch (e) {
        logger.error("Twilio send failed", { phone, error: e.message });
        skipped++;
      }
    }

    logger.info("Listing notification fanout", {
      listingId: event.params.listingId,
      sent,
      skipped,
    });
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
