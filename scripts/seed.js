// scripts/seed.js
// Purpose: Seed ONLY kata from the syllabus (no bunkai, kumite, or weapons).

require("dotenv").config();
const connectDB = require("../db");
const Form = require("../models/Form");

async function run() {
  await connectDB();

  // Fresh start: wipe all forms
  await Form.deleteMany({});
  console.log("🗑️ Cleared forms collection. Seeding kata…");

  // Helper to shorten object creation
  const K = (name, rankType, rankNumber, beltColor) => ({
    name,
    rankType, // "Kyu" or "Dan" (capitalized to match your form)
    rankNumber, // number
    category: "Kata", // kata-only seeding
    beltColor, // display color
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

    // 4th Kyu (Green) — bunkai items are intentionally excluded
    // (No pure kata listed distinct from Saifa/Geikiha here in your source)

    // 3rd Kyu (Brown)
    K("Seyunchin", "Kyu", 3, "Brown"),
    K("Kakuha", "Kyu", 3, "Brown"),

    // 2nd Kyu (Brown)
    K("Seisan", "Kyu", 2, "Brown"),

    // 1st Kyu (Brown) — bunkai excluded
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
    // 8th Dan: Your list includes Kin Gai Ryu kata — keeping them as kata:
    K("Kin Gai Ryu Kakaho", "Dan", 8, "Black"),
    K("Kin Gai Ryu #1", "Dan", 8, "Black"),
    K("Kin Gai Ryu #2", "Dan", 8, "Black"),
  ];

  const docs = [...kyuKata, ...danKata];

  // Insert all
  await Form.insertMany(docs);

  const aliveCount = await Form.countDocuments({ deletedAt: null });
  const totalCount = await Form.countDocuments({});
  console.log(
    `✅ Kata seed complete. Alive: ${aliveCount}  |  Total docs: ${totalCount}`
  );

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
