// scripts/seed.js
// Purpose: Seed ONLY kata from the syllabus (no bunkai, kumite, or weapons), for a demo user.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../db");
const Form = require("../models/Form");
const User = require("../models/User"); // <-- adjust path/name if different

async function run() {
  await connectDB();

  // 1) Upsert a demo user you’ll log in with
  const email = process.env.DEMO_EMAIL || "demo@dojo.app";
  const plain = process.env.DEMO_PASSWORD || "demo123";
  const passwordHash = await bcrypt.hash(plain, 10);

  const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, passwordHash } },
    { new: true, upsert: true }
  );

  // 2) Start clean for THIS user
  await Form.deleteMany({ owner: user._id });
  console.log("🗑️ Cleared this user's forms. Seeding kata…");

  // Helper: normalize belt color to lowercase; add required fields
  const K = (name, rankType, rankNumber, beltColor) => ({
    owner: user._id,
    name,
    rankType,                 // "Kyu" or "Dan"
    rankNumber,               // number
    category: "Kata",
    beltColor: (beltColor || "").toLowerCase() || undefined,
    description: "",
    learned: false,
  });

  // ---- K Y U  K A T A  ----
  const kyuKata = [
    // 10th Kyu (White)
    K("Sanchin", "Kyu", 10, "White"),
    K("Basic Kata #1", "Kyu", 10, "White"),

    // 9th Kyu (White)
    K("Basic Kata #2", "Kyu", 9, "White"),

    // 8th Kyu (White)
    K("Geikisai #1", "Kyu", 8, "White"),

    // 7th Kyu (White)
    K("Geikisai #2", "Kyu", 7, "White"),

    // 6th Kyu (Green)
    K("Geikisai #3", "Kyu", 6, "Green"),
    K("Tensho", "Kyu", 6, "Green"),

    // 5th Kyu (Green)
    K("Saifa", "Kyu", 5, "Green"),
    K("Geikiha", "Kyu", 5, "Green"),

    // 3rd Kyu (Brown)
    K("Seyunchin", "Kyu", 3, "Brown"),
    K("Kakuha", "Kyu", 3, "Brown"),

    // 2nd Kyu (Brown)
    K("Seisan", "Kyu", 2, "Brown"),
  ];

  // ---- D A N  K A T A  ----
  const danKata = [
    K("Seipai", "Dan", 1, "Black"),
    K("Shisochin", "Dan", 2, "Black"),
    K("Sanseiru", "Dan", 3, "Black"),
    K("Kururunfa", "Dan", 4, "Black"),
    K("Pichurin", "Dan", 5, "Black"), // (Peichurin)
    K("Hakutsuru Sho", "Dan", 6, "Black"),
    K("Hakutsuru Dai", "Dan", 7, "Black"),
    K("Kin Gai Ryu Kakaho", "Dan", 8, "Black"),
    K("Kin Gai Ryu #1", "Dan", 8, "Black"),
    K("Kin Gai Ryu #2", "Dan", 8, "Black"),
  ];

  const docs = [...kyuKata, ...danKata];

  await Form.insertMany(docs);

  const aliveCount = await Form.countDocuments({ deletedAt: null, owner: user._id });
  console.log(`✅ Kata seed complete for ${email}. Alive: ${aliveCount}`);
  console.log(`👉 Log in as ${email} / ${plain}`);

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
