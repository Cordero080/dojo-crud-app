/**
 * scripts/seed.js
 * -----------------------------------------------------------------------------
 * PURPOSE
 *   Seed your database with the full syllabus (Kata + Bunkai + Kiso Kumite + Weapons)
 *   for a single *demo* user. It clears only that user's Forms and re-inserts
 *   a canonical set, so you can demo the app with predictable data.
 *
 * HOW TO RUN (local/dev)
 *   1) Make sure your .env has:
 *        MONGODB_URI=mongodb://127.0.0.1:27017/dojo   (or your URI)
 *        DEMO_EMAIL=demo@dojo.app
 *        DEMO_PASSWORD=demo123
 *        SEED_MARK_LEARNED=true    (optional; marks all as learned if "true")
 *   2) From project root:
 *        npm run seed
 *      (Your package.json should map "seed": "node -r dotenv/config scripts/seed.js")
 *
 * WHAT IT DOES (step-by-step)
 *   - Connects to MongoDB (via ../db).
 *   - Ensures a demo user exists (creates one if missing).
 *   - Deletes ONLY that user's existing Forms (so re-running resets them).
 *   - Inserts the full syllabus with correct enum-safe categories.
 *   - Optionally flags every doc as learned when SEED_MARK_LEARNED=true.
 *
 * STUDY NOTES
 *   - We keep *names* like "Kiso Kumite #3" (that's the form name), BUT the
 *     *category* must match your schema enum exactly: "Kumite". The helper
 *     normalizeCategory() maps "Kiso Kumite" -> "Kumite" defensively so you
 *     won't trip the enum even if you pass the old label.
 *   - Everything related to ownership is per-user: we set owner: user._id on
 *     every inserted Form.
 *   - Re-running is idempotent for the demo user because we first delete their
 *     forms, then insert the same known set.
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");     // easier to install than native "bcrypt"
const connectDB = require("../db");
const Form = require("../models/Form");
const User = require("../models/User");

/* -------------------------- env + switches -------------------------- */
// When true, every inserted form gets learned: true (nice for demo screenshots).
const MARK_LEARNED =
  String(process.env.SEED_MARK_LEARNED || "").toLowerCase() === "true";

// Demo user credentials (can be overridden via .env)
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@dojo.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo123";

/* ------------------------ small helper utils ------------------------ */
/**
 * Ensure category string matches the schema enum. Your schema allows:
 *   "Kata" | "Bunkai" | "Kumite" | "Weapon" | "Other"
 * We defensively convert "Kiso Kumite" => "Kumite".
 */
function normalizeCategory(category) {
  if (String(category).toLowerCase() === "kiso kumite") return "Kumite";
  return category;
}

/**
 * Build one Form doc with normalized fields. Belt colors are stored lowercase,
 * and learned defaults from MARK_LEARNED so you can toggle a demo-on switch.
 */
function add(owner, rankType, rankNumber, beltColor, category, name) {
  return {
    owner,                                     // <ObjectId> the demo user's _id
    name,                                      // "Seipai Kata", etc.
    rankType,                                  // "Kyu" | "Dan"
    rankNumber,                                // Number
    category: normalizeCategory(category),     // enum-safe string
    beltColor: (beltColor || "").toLowerCase() || undefined,
    description: "",
    referenceUrl: undefined,
    learned: MARK_LEARNED,                     // flip globally via env
  };
}

/* ------------------------------ main ------------------------------- */
async function run() {
  await connectDB();

  /* 1) Ensure the demo user exists (upsert) */
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    { $setOnInsert: { email: DEMO_EMAIL, passwordHash } },
    { new: true, upsert: true }
  );

  /* 2) Start clean for THIS user so the seed is repeatable */
  await Form.deleteMany({ owner: user._id });
    // Removed console.log statement

  /* 3) Build the canonical dataset */
  const D = [];

  // ---------------------- WHITE BELT (KYU 10 → 7) ----------------------
  // 10th KYU (white)
  ["Sanchin Kata", "Basic (Kihon, Tando Ku, Fukyu) Kata #1"].forEach((n) =>
    D.push(add(user._id, "Kyu", 10, "white", "Kata", n))
  );
  D.push(
    add(
      user._id,
      "Kyu",
      10,
      "white",
      "Bunkai",
      "Basic Kata #1 Bunkai (both sides)"
    )
  );

  // 9th KYU (white)
  D.push(
    add(
      user._id,
      "Kyu",
      9,
      "orange",
      "Kata",
      "Basic (Kihon, Tando Ku, Fukyu) Kata #2"
    )
  );
  D.push(
    add(
      user._id,
      "Kyu",
      9,
      "white",
      "Bunkai",
      "Basic Kata #2 Bunkai (both sides)"
    )
  );
  D.push(add(user._id, "Kyu", 9, "white", "Kiso Kumite", "Kiso Kumite #1")); // category normalized to "Kumite"

  // 8th KYU (white)
  D.push(add(user._id, "Kyu", 8, "orange", "Kata", "Geikisai #1 Kata"));
  D.push(
    add(user._id, "Kyu", 8, "", "Bunkai", "Geikisai #1 Bunkai (both sides)")
  );

  // 7th KYU (white)
  D.push(add(user._id, "Kyu", 7, "orange", "Kata", "Geikisai #2 Kata"));
  D.push(
    add(user._id, "Kyu", 7, "orange", "Bunkai", "Geikisai #2 Bunkai (both sides)")
  );
  D.push(add(user._id, "Kyu", 7, "orange", "Kiso Kumite", "Kiso Kumite #2"));

  // ---------------------- GREEN / PURPLE (KYU 6 → 4) -------------------
  // 6th KYU (green)
  ["Geikisai #3 Kata", "Tensho Kata"].forEach((n) =>
    D.push(add(user._id, "Kyu", 6, "green", "Kata", n))
  );
  D.push(
    add(user._id, "Kyu", 6, "green", "Bunkai", "Geikisai #3 Bunkai (both sides)")
  );
  D.push(add(user._id, "Kyu", 6, "green", "Kiso Kumite", "Kiso Kumite #3"));

  // 5th KYU (green → purple in legend)
  ["Saifa Kata", "Geikiha Kata"].forEach((n) =>
    D.push(add(user._id, "Kyu", 5, "green", "Kata", n))
  );

  // 4th KYU (purple)
  D.push(add(user._id, "Kyu", 4, "purple", "Bunkai", "Saifa Bunkai"));
  D.push(add(user._id, "Kyu", 4, "purple", "Bunkai", "Geikiha Bunkai"));
  D.push(add(user._id, "Kyu", 4, "purple", "Kiso Kumite", "Kiso Kumite #4"));

  // --------------------------- BROWN (KYU 3 → 1) -----------------------
  // 3rd KYU (brown)
  ["Seyunchin Kata", "Kakuha Kata"].forEach((n) =>
    D.push(add(user._id, "Kyu", 3, "brown", "Kata", n))
  );
  D.push(add(user._id, "Kyu", 3, "brown", "Kiso Kumite", "Kiso Kumite #5"));

  // 2nd KYU (brown)
  D.push(add(user._id, "Kyu", 2, "brown", "Bunkai", "Kakuha Bunkai"));
  D.push(add(user._id, "Kyu", 2, "brown", "Kata", "Seisan Kata"));
  D.push(add(user._id, "Kyu", 2, "brown", "Weapon", "Bo Kata #1 - Chi Hon NoKun"));

  // 1st KYU (black per legend)
  D.push(add(user._id, "Kyu", 1, "black", "Bunkai", "Seisan Bunkai"));
  D.push(add(user._id, "Kyu", 1, "black", "Kiso Kumite", "Kiso Kumite #6"));
  D.push(add(user._id, "Kyu", 1, "black", "Weapon", "Sai Kata #1"));

  // ------------------------------ DAN 1 → 8 ----------------------------
  // 1st DAN
  D.push(add(user._id, "Dan", 1, "black", "Kata", "Seipai Kata"));
  ["Kiso Kumite #7", "Jisien Kumite", "Seipai Kai Sai Kumite"].forEach((n) =>
    D.push(add(user._id, "Dan", 1, "black", "Kiso Kumite", n))
  );
  ["Sagawa No Kun", "Tonfa Kata"].forEach((n) =>
    D.push(add(user._id, "Dan", 1, "black", "Weapon", n))
  );

  // 2nd DAN
  D.push(add(user._id, "Dan", 2, "black", "Kata", "Shisochin Kata"));
  D.push(add(user._id, "Dan", 2, "black", "Kiso Kumite", "Shisochin Kai Sai Kumite"));
  ["Sagakawa No Kun", "Tonfa Kata"].forEach((n) =>
    D.push(add(user._id, "Dan", 2, "black", "Weapon", n))
  );

  // 3rd DAN
  D.push(add(user._id, "Dan", 3, "black", "Kata", "Sanseiru Kata"));
  D.push(add(user._id, "Dan", 3, "black", "Kiso Kumite", "Sanseiru Kai Sai Kumite"));
  ["Shushi No Kun", "Nunchaku Kata"].forEach((n) =>
    D.push(add(user._id, "Dan", 3, "black", "Weapon", n))
  );

  // 4th DAN
  D.push(add(user._id, "Dan", 4, "black", "Kata", "Kururunfa Kata"));
  D.push(add(user._id, "Dan", 4, "black", "Kiso Kumite", "Kururunfa Kai Sai Kumite"));
  ["Tsuken No Kun", "Kama Kata"].forEach((n) =>
    D.push(add(user._id, "Dan", 4, "black", "Weapon", n))
  );

  // 5th DAN
  D.push(add(user._id, "Dan", 5, "black", "Kata", "Pichurin Kata"));
  D.push(add(user._id, "Dan", 5, "black", "Kiso Kumite", "Peichurin Kai Sai Kumite"));
  D.push(add(user._id, "Dan", 5, "black", "Weapon", "Nunti-Bo Kata"));

  // 6th DAN
  D.push(add(user._id, "Dan", 6, "black", "Kata", "Hakatsuru Kata Sho"));

  // 7th DAN
  D.push(add(user._id, "Dan", 7, "black", "Kata", "Hakatsuru Kata Dai"));

  // 8th DAN
  ["Kin Gai Ryu Kakaho Kata", "Kin Gai Ryu #1 Kata", "Kin Gai Ryu #2 Kata"].forEach(
    (n) => D.push(add(user._id, "Dan", 8, "black", "Kata", n))
  );
  D.push(add(user._id, "Dan", 8, "black", "Weapon", "Knife Kata"));

  /* 4) Insert and report */
  await Form.insertMany(D);
  const aliveCount = await Form.countDocuments({
    owner: user._id,
    deletedAt: null,
  });

    // Removed console.log statements

  process.exit(0);
}

/* Kick it off. Any unhandled error will be printed and exit(1). */
run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
