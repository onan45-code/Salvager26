const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

exports.onListingCreate = onDocumentCreated(
  {
    document: "listings/{listingId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
  },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;
    if (listing.status === "deleted") return;

    const client = twilio(TWILIO_ACCOUNT_SID.value(), TWILIO_AUTH_TOKEN.value());
    const fromNumber = TWILIO_FROM_NUMBER.value();

    const usersSnap = await admin.firestore().collection("users").get();
    const zipCache = {};
    const listingCoords = await getZipCoords(listing.zip, zipCache);

    let sent = 0;
    let skipped = 0;

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();

      if (u.uid === listing.sellerId) { skipped++; continue; }
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
