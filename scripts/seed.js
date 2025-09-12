// scripts/seed.js
// Seed the full syllabus: kata + bunkai + kiso kumite + weapons, for a demo user.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../db");
const Form = require("../models/Form");
const User = require("../models/User");

// Set SEED_MARK_LEARNED=true in .env if you want all items to count as learned for the demo
const MARK_LEARNED = String(process.env.SEED_MARK_LEARNED || "").toLowerCase() === "true";

const demoEmail = process.env.DEMO_EMAIL;
const demoPass  = process.env.DEMO_PASSWORD;

const add = (owner, rankType, rankNumber, beltColor, category, name) => ({
  owner,
  name,
  rankType,                      // "Kyu" | "Dan"
  rankNumber,                    // number
  category,                      // "Kata" | "Bunkai" | "Kiso Kumite" | "Weapon"
  beltColor: (beltColor || "").toLowerCase() || undefined,
  description: "",
  referenceUrl: undefined,
  learned: MARK_LEARNED,         // flip with SEED_MARK_LEARNED
});

async function run() {
  await connectDB();

  // 1) Create/ensure the demo user
  const passwordHash = await bcrypt.hash(demoPass, 10);
  const user = await User.findOneAndUpdate(
    { email: demoEmail },
    { $setOnInsert: { email: demoEmail, passwordHash } },
    { new: true, upsert: true }
  );

  // 2) Start clean for THIS user
  await Form.deleteMany({ owner: user._id });
  console.log("🗑️ Cleared this user's forms. Seeding full syllabus…");

  const D = []; // docs to insert

  // ---------- WHITE BELT ----------
  // 10th KYU (white)
  ["Sanchin Kata", "Basic (Kihon, Tando Ku, Fukyu) Kata #1"].forEach(n =>
    D.push(add(user._id, "Kyu", 10, "white", "Kata", n)));
  D.push(add(user._id, "Kyu", 10, "white", "Bunkai", "Basic Kata #1 Bunkai (both sides)"));

  // 9th KYU (white)
  D.push(add(user._id, "Kyu", 9, "white", "Kata", "Basic (Kihon, Tando Ku, Fukyu) Kata #2"));
  D.push(add(user._id, "Kyu", 9, "white", "Bunkai", "Basic Kata #2 Bunkai (both sides)"));
  D.push(add(user._id, "Kyu", 9, "white", "Kiso Kumite", "Kiso Kumite #1"));

  // 8th KYU (white)
  D.push(add(user._id, "Kyu", 8, "white", "Kata", "Geikisai #1 Kata"));
  D.push(add(user._id, "Kyu", 8, "white", "Bunkai", "Geikisai #1 Bunkai (both sides)"));

  // 7th KYU (white)
  D.push(add(user._id, "Kyu", 7, "white", "Kata", "Geikisai #2 Kata"));
  D.push(add(user._id, "Kyu", 7, "white", "Bunkai", "Geikisai #2 Bunkai (both sides)"));
  D.push(add(user._id, "Kyu", 7, "white", "Kiso Kumite", "Kiso Kumite #2"));

  // ---------- GREEN BELT ----------
  // 6th KYU (green)
  ["Geikisai #3 Kata", "Tensho Kata"].forEach(n =>
    D.push(add(user._id, "Kyu", 6, "green", "Kata", n)));
  D.push(add(user._id, "Kyu", 6, "green", "Bunkai", "Geikisai #3 Bunkai (both sides)"));
  D.push(add(user._id, "Kyu", 6, "green", "Kiso Kumite", "Kiso Kumite #3"));

  // 5th KYU (green → purple in your legend)
  ["Saifa Kata", "Geikiha Kata"].forEach(n =>
    D.push(add(user._id, "Kyu", 5, "green", "Kata", n)));

  // 4th KYU (purple)
  D.push(add(user._id, "Kyu", 4, "purple", "Bunkai", "Saifa Bunkai"));
  D.push(add(user._id, "Kyu", 4, "purple", "Bunkai", "Geikiha Bunkai"));
  D.push(add(user._id, "Kyu", 4, "purple", "Kiso Kumite", "Kiso Kumite #4"));

  // ---------- BROWN BELT ----------
  // 3rd KYU (brown)
  ["Seyunchin Kata", "Kakuha Kata"].forEach(n =>
    D.push(add(user._id, "Kyu", 3, "brown", "Kata", n)));
  D.push(add(user._id, "Kyu", 3, "brown", "Kiso Kumite", "Kiso Kumite #5"));

  // 2nd KYU (brown)
  D.push(add(user._id, "Kyu", 2, "brown", "Bunkai", "Kakuha Bunkai"));
  D.push(add(user._id, "Kyu", 2, "brown", "Kata", "Seisan Kata"));
  D.push(add(user._id, "Kyu", 2, "brown", "Weapon", "Bo Kata #1 - Chi Hon NoKun"));

  // 1st KYU (black per your legend)
  D.push(add(user._id, "Kyu", 1, "black", "Bunkai", "Seisan Bunkai"));
  D.push(add(user._id, "Kyu", 1, "black", "Kiso Kumite", "Kiso Kumite #6"));
  D.push(add(user._id, "Kyu", 1, "black", "Weapon", "Sai Kata #1"));

  // ---------- BLACK BELT ----------
  // 1st DAN
  ["Seipai Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 1, "black", "Kata", n)));
  ["Kiso Kumite #7", "Jisien Kumite", "Seipai Kai Sai Kumite"].forEach(n =>
    D.push(add(user._id, "Dan", 1, "black", "Kiso Kumite", n)));
  ["Sagawa No Kun", "Tonfa Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 1, "black", "Weapon", n)));

  // 2nd DAN
  D.push(add(user._id, "Dan", 2, "black", "Kata", "Shisochin Kata"));
  D.push(add(user._id, "Dan", 2, "black", "Kiso Kumite", "Shisochin Kai Sai Kumite"));
  ["Sagakawa No Kun", "Tonfa Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 2, "black", "Weapon", n)));

  // 3rd DAN
  D.push(add(user._id, "Dan", 3, "black", "Kata", "Sanseiru Kata"));
  D.push(add(user._id, "Dan", 3, "black", "Kiso Kumite", "Sanseiru Kai Sai Kumite"));
  ["Shushi No Kun", "Nunchaku Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 3, "black", "Weapon", n)));

  // 4th DAN
  D.push(add(user._id, "Dan", 4, "black", "Kata", "Kururunfa Kata"));
  D.push(add(user._id, "Dan", 4, "black", "Kiso Kumite", "Kururunfa Kai Sai Kumite"));
  ["Tsuken No Kun", "Kama Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 4, "black", "Weapon", n)));

  // 5th DAN
  D.push(add(user._id, "Dan", 5, "black", "Kata", "Pichurin Kata"));
  D.push(add(user._id, "Dan", 5, "black", "Kiso Kumite", "Peichurin Kai Sai Kumite"));
  D.push(add(user._id, "Dan", 5, "black", "Weapon", "Nunti-Bo Kata"));

  // 6th DAN
  D.push(add(user._id, "Dan", 6, "black", "Kata", "Hakatsuru Kata Sho"));

  // 7th DAN
  D.push(add(user._id, "Dan", 7, "black", "Kata", "Hakatsuru Kata Dai"));

  // 8th DAN
  ["Kin Gai Ryu Kakaho Kata", "Kin Gai Ryu #1 Kata", "Kin Gai Ryu #2 Kata"].forEach(n =>
    D.push(add(user._id, "Dan", 8, "black", "Kata", n)));
  D.push(add(user._id, "Dan", 8, "black", "Weapon", "Knife Kata"));

  // 3) Insert all
  await Form.insertMany(D);
  const aliveCount = await Form.countDocuments({ owner: user._id, deletedAt: null });
  console.log(`✅ Full seed complete for ${demoEmail}. Alive: ${aliveCount}`);
  console.log(`👉 Log in as ${demoEmail} / ${demoPass}${MARK_LEARNED ? " (all marked learned)" : ""}`);

  process.exit(0);
}

run().catch(err => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
