// POST /api/signup  { name, email, website }
// Stores a grown-up's name + email in MongoDB. Without MONGODB_URI it answers a
// friendly 503 instead of crashing.
const { MongoClient } = require("mongodb");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let clientPromise;
function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .connect()
      .catch((err) => {
        clientPromise = undefined; // allow a retry on the next request
        throw err;
      });
  }
  return clientPromise;
}

function send(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  if (!process.env.MONGODB_URI) {
    return send(res, 503, { error: "Sign-ups are not switched on yet. Please try again soon." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return send(res, 200, { ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (name.length < 1 || name.length > 80) {
    return send(res, 400, { error: "Please enter your name." });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return send(res, 400, { error: "Please enter a valid email address." });
  }

  try {
    const client = await getClient();
    const users = client.db(process.env.MONGODB_DB || "abcya").collection("signups");
    await users.createIndex({ email: 1 }, { unique: true });
    await users.insertOne({ name, email, createdAt: new Date() });
    return send(res, 200, { ok: true });
  } catch (err) {
    if (err && err.code === 11000) {
      return send(res, 200, { ok: true, already: true });
    }
    console.error("signup failed:", err && err.message);
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
};
