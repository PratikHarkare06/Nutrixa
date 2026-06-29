// authMiddleware.js — Verifies Firebase ID tokens manually using Google's public certificates
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { createAppError } = require("../utils/createAppError");

let cachedKeys = null;
let cacheExpiry = 0;

const fetchGooglePublicKeys = async () => {
  if (cachedKeys && Date.now() < cacheExpiry) {
    return cachedKeys;
  }

  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!response.ok) {
    throw new Error("Failed to fetch Google public keys");
  }

  const cacheControl = response.headers.get("cache-control");
  let maxAge = 3600; // default 1 hour
  if (cacheControl) {
    const match = cacheControl.match(/max-age=(\d+)/);
    if (match) {
      maxAge = parseInt(match[1], 10);
    }
  }

  cachedKeys = await response.json();
  cacheExpiry = Date.now() + (maxAge * 1000);
  return cachedKeys;
};

const verifyFirebaseIdToken = async (token) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID environment variable is missing.");
  }

  // 1. Decode token to extract header's key ID (kid)
  const decodedToken = jwt.decode(token, { complete: true });
  if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
    throw new Error("Invalid token structure or missing 'kid' in header.");
  }

  const { kid, alg } = decodedToken.header;
  if (alg !== "RS256") {
    throw new Error("Invalid algorithm. Firebase ID tokens must be signed with RS256.");
  }

  // 2. Fetch Google's public certificates
  let keys = await fetchGooglePublicKeys();
  let cert = keys[kid];

  if (!cert) {
    // If not found in cache, clear cache and re-fetch once to handle key rotation
    cachedKeys = null;
    keys = await fetchGooglePublicKeys();
    cert = keys[kid];
    if (!cert) {
      throw new Error(`Public key not found for kid: ${kid}`);
    }
  }

  // 3. Verify the token signature and validate claims using jsonwebtoken
  const decodedPayload = jwt.verify(token, cert, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  // Verify sub is present and non-empty
  if (!decodedPayload.sub || typeof decodedPayload.sub !== "string" || decodedPayload.sub.trim() === "") {
    throw new Error("Token payload is missing a valid 'sub' claim.");
  }

  return decodedPayload;
};

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

const resolveUserFromFirebaseToken = async (token) => {
  const decoded = await verifyFirebaseIdToken(token);
  const uid = decoded.user_id || decoded.sub;

  // Find user in MongoDB by Firebase UID
  let user = await User.findOne({ firebaseUid: uid }).select("-password");
  if (!user) {
    // Auto-create user record on first hit if sync was missed
    user = await User.create({
      firebaseUid: uid,
      name: decoded.name || decoded.email?.split("@")[0] || "User",
      email: decoded.email || `${uid}@firebase.local`,
      provider: "firebase",
    });
  }
  return user;
};

// Full protection — rejects if no valid token
const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(createAppError(401, "UNAUTHORIZED", "Please log in to access this feature."));
  }

  try {
    const user = await resolveUserFromFirebaseToken(token);
    req.user = user;
    next();
  } catch (firebaseErr) {
    console.error("Firebase token verification failed:", firebaseErr.message);
    return next(createAppError(401, "UNAUTHORIZED", "Session expired. Please log in again."));
  }
};

// Optional — allows guest access, attaches user if token is valid
const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(); // Guest — no token

  try {
    const user = await resolveUserFromFirebaseToken(token);
    req.user = user;
  } catch (err) {
    console.log("Optional auth: invalid token, proceeding as guest");
  }
  next();
};

module.exports = { protect, optionalProtect };

