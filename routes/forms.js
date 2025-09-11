// routes/forms.js
// Forms CRUD (RESTful) + soft delete/trash/restore, charts, requirements.
// Auth notes: routes that change data use `requireAuth`; queries are owner-scoped via `req.session.user._id`.

const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const requireAuth = require("../middleware/requireAuth");

// -------- Reference data (static) --------
const MASTER_FORMS = [
  "Basic (Kihon, Tando Ku, Fukyu) Kata #1",
  "Basic Kata #1 Bunkai (both sides)",
  "Sanchin Kata",
  "Basic (Kihon, Tando Ku, Fukyu) Kata #2",
  "Basic Kata #2 Bunkai (both sides)",
  "Kiso Kumite #1",
  "Geikisai #1 Kata",
  "Geikisai #1 Bunkai (both sides)",
  "Geikisai #2 Kata",
  "Geikisai #2 Bunkai (both sides)",
  "Kiso Kumite #2",
  "Geikisai #3 Kata",
  "Geikisai #3 Bunkai (both sides)",
  "Tensho Kata",
  "Kiso Kumite #3",
  "Saifa Kata",
  "Geikiha Kata",
  "Saifa Bunkai",
  "Gaikiha Bunkai",
  "Kiso Kumite #4",
  "Seyunchin Kata",
  "Kakuha Kata",
  "Kiso Kumite #5",
  "Kakuha Bunkai",
  "Seisan Kata",
  "Seisan Bunkai",
  "Kiso Kumite #6",
  "Sai Kata #1",
  "Bo Kata #1 - Chi Hon NoKun",
  "Seipai Kata",
  "Kiso Kumite #7",
  "Jisien Kumite",
  "Seipai Kai Sai Kumite",
  "Shisochin Kata",
  "Shisochin Kai Sai Kumite",
  "Sanseiru Kata",
  "Sanseiru Kai Sai Kumite",
  "Kururunfa Kata",
  "Kururunfa Kai Sai Kumite",
  "Pichurin Kata",
  "Peichurin Kai Sai Kumite",
  "Hakatsuru Kata Sho",
  "Hakatsuru Kata Dai",
  "Kin Gai Ryu Kakaho Kata",
  "Kin Gai Ryu #1 Kata",
  "Kin Gai Ryu #2 Kata",
  "Sagawa No Kun",
  "Tonfa Kata",
  "Shushi No Kun",
  "Nunchaku Kata",
  "Tsuken No Kun",
  "Kama Kata",
  "Nunti-Bo Kata",
  "Knife Kata",
];

// -------- Helpers --------
async function getExistingAliveNames(ownerId) {
  const docs = await Form.find({ deletedAt: null, owner: ownerId }).select(
    "name -_id"
  );
  return docs.map((d) => d.name);
}
function computeAvailableNames(master, existing) {
  const taken = new Set(existing.map((s) => String(s).toLowerCase()));
  return master
    .filter((n) => !taken.has(String(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
function formatErrors(err) {
  return Object.fromEntries(
    Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
  );
}
async function getChartData(ownerId) {
  const labels = [
    ...Array.from({ length: 10 }, (_, i) => `KYU ${10 - i}`),
    ...Array.from({ length: 8 }, (_, i) => `DAN ${i + 1}`),
  ];
  const counts = new Map(labels.map((l) => [l, 0]));
  const alive = await Form.find({ deletedAt: null, owner: ownerId }).select(
    "rankType rankNumber"
  );
  for (const f of alive) {
    const label = `${String(f.rankType).toUpperCase()} ${Number(f.rankNumber)}`;
    if (counts.has(label)) counts.set(label, counts.get(label) + 1);
  }
  return { chartLabels: labels, chartCounts: labels.map((l) => counts.get(l)) };
}
function getRequirements() {
  const kyuRequirements = {
    10: [
      "Basic (Kihon, Tando Ku, Fukyu) Kata #1",
      "Basic Kata #1 Bunkai (both sides)",
      "Sanchin Kata",
    ],
    9: [
      "Basic (Kihon, Tando Ku, Fukyu) Kata #2",
      "Basic Kata #2 Bunkai (both sides)",
      "Kiso Kumite #1",
    ],
    8: ["Geikisai #1 Kata", "Geikisai #1 Bunkai (both sides)"],
    7: [
      "Geikisai #2 Kata",
      "Geikisai #2 Bunkai (both sides)",
      "Kiso Kumite #2",
    ],
    6: [
      "Geikisai #3 Kata",
      "Geikisai #3 Bunkai (both sides)",
      "Tensho Kata",
      "Kiso Kumite #3",
    ],
    5: ["Saifa Kata", "Geikiha Kata"],
    4: ["Saifa Bunkai", "Gaikiha Bunkai", "Kiso Kumite #4"],
    3: ["Seyunchin Kata", "Kakuha Kata", "Kiso Kumite #5"],
    2: ["Kakuha Bunkai", "Seisan Kata", "Bo Kata #1 - Chi Hon NoKun"],
    1: ["Seisan Bunkai", "Kiso Kumite #6", "Sai Kata #1"],
  };
  const danRequirements = {
    1: [
      "Seipai Kata",
      "Kiso Kumite #7",
      "Jisien Kumite",
      "Seipai Kai Sai Kumite",
      "Sagawa No Kun",
      "Tonfa Kata",
    ],
    2: [
      "Shisochin Kata",
      "Shisochin Kai Sai Kumite",
      "Sagakawa No Kun",
      "Tonfa Kata",
    ],
    3: [
      "Sanseiru Kata",
      "Sanseiru Kai Sai Kumite",
      "Shushi No Kun",
      "Nunchaku Kata",
    ],
    4: [
      "Kururunfa Kata",
      "Kururunfa Kai Sai Kumite",
      "Tsuken No Kun",
      "Kama Kata",
    ],
    5: ["Pichurin Kata", "Peichurin Kai Sai Kumite", "Nunti-Bo Kata"],
    6: ["Hakatsuru Kata Sho"],
    7: ["Hakatsuru Kata Dai"],
    8: [
      "Kin Gai Ryu Kakaho Kata",
      "Kin Gai Ryu #1 Kata",
      "Kin Gai Ryu #2 Kata",
      "Knife Kata",
    ],
  };
  return { kyuRequirements, danRequirements };
}
function getKyuChipMap() {
  return {
    10: "chip-white",
    9: "chip-white-orange",
    8: "chip-orange",
    7: "chip-orange-green",
    6: "chip-green",
    5: "chip-green-purple",
    4: "chip-purple",
    3: "chip-purple-brown",
    2: "chip-brown",
    1: "chip-black",
  };
}
async function getNewPageData(ownerId) {
  const [existingNames, chart, reqs] = await Promise.all([
    getExistingAliveNames(ownerId),
    getChartData(ownerId),
    Promise.resolve(getRequirements()),
  ]);
  return {
    availableNames: computeAvailableNames(MASTER_FORMS, existingNames),
    chartLabels: chart.chartLabels,
    chartCounts: chart.chartCounts,
    kyuRequirements: reqs.kyuRequirements,
    danRequirements: reqs.danRequirements,
    kyuChipMap: getKyuChipMap(),
  };
}

// ======================= RESTful routes =======================
// Index:    GET    /forms          → list (auth-scoped)
// New:      GET    /forms/new      → create form page (auth required)
// Create:   POST   /forms          → create (auth required)
// Show:     GET    /forms/:id      → details (public read)
// Edit:     GET    /forms/:id/edit → edit page (auth + owner)
// Update:   PUT    /forms/:id      → update (auth + owner)
// Destroy:  DELETE /forms/:id      → soft delete (auth + owner)
// Trash:    GET    /forms/trash    → list deleted (auth + owner)
// Restore:  POST   /forms/:id/restore → undelete (auth + owner)

// -------- New (auth) --------
router.get("/forms/new", requireAuth, async (req, res) => {
  try {
    const data = await getNewPageData(req.session.user._id);

    res.render("new", {
      title: "Add New Martial Arts Form",
      error: null,
      errors: {},
      formData: {},
      ...data,
    });
  } catch (e) {
    console.error("GET /forms/new error:", e.message);
    res.render("new", {
      title: "Add New Martial Arts Form",
      error: "Failed to load reference data.",
      errors: {},
      formData: {},
      availableNames: [],
      chartLabels: [],
      chartCounts: [],
      kyuRequirements: {},
      danRequirements: {},
      kyuChipMap: {},
    });
  }
});

// -------- Create (auth) --------
router.post("/forms", requireAuth, async (req, res, next) => {
  const ownerId = req.session.user?._id;
  const renderNew = async ({
    error = null,
    errors = {},
    formData = req.body,
    status = 400,
  } = {}) => {
    const data = await getNewPageData(ownerId);
    return res
      .status(status)
      .render("new", {
        title: "Add New Martial Arts Form",
        error,
        errors,
        formData,
        ...data,
      });
  };

  try {
    const {
      name = "",
      rankType,
      rankNumber,
      beltColor = "",
      category = "Kata",
      description = "",
      referenceUrl = "",
      learned,
    } = req.body;

    const doc = {
      owner: ownerId,
      name: name.trim(),
      rankType,
      rankNumber: Number(rankNumber),
      beltColor: beltColor.trim() || undefined,
      category,
      description: String(description ?? ""),
      referenceUrl: referenceUrl.trim() || undefined,
      learned: learned === "on",
    };

    if (!Number.isFinite(doc.rankNumber)) {
      return renderNew({
        errors: { rankNumber: "Rank number must be a valid number" },
      });
    }

    const exists = await Form.exists({
      owner: ownerId,
      name: doc.name,
      rankType: doc.rankType,
      rankNumber: doc.rankNumber,
      deletedAt: null,
    });
    if (exists)
      return renderNew({ error: "That form already exists for this rank." });

    await Form.create(doc);
    res.redirect("/forms");
  } catch (err) {
    if (err?.code === 11000)
      return renderNew({ error: "That form already exists for this rank." });
    if (err?.name === "ValidationError")
      return renderNew({ errors: formatErrors(err) });
    next(err);
  }
});

// -------- Index (auth-scoped; logged-out shows none) --------
router.get("/forms", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.render("forms/index2", { title: "All Forms", forms: [] });
    }
    const forms = await Form.find({
      deletedAt: null,
      owner: req.session.user._id,
    }).sort({ rankType: 1, rankNumber: 1, name: 1 });
    res.render("forms/index2", { title: "All Forms", forms });
  } catch (e) {
    console.error("GET /forms error:", e.message);
    res.status(500).send("Failed to load forms");
  }
});

// -------- Trash (auth + owner) --------
router.get("/forms/trash", requireAuth, async (req, res) => {
  try {
    const forms = await Form.find({
      deletedAt: { $ne: null },
      owner: req.session.user._id,
    }).sort({ updatedAt: -1 });
    res.render("forms/trash", { title: "Trash", forms });
  } catch {
    res.status(500).send("Failed to load trash");
  }
});

// -------- Edit (auth + owner) --------
router.get("/forms/:id/edit", requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id))
      return res.status(403).send("Forbidden");

    res.render("forms/edit", {
      title: `Edit: ${form.name}`,
      form,
      error: null,
      errors: {},
      formData: {},
    });
  } catch {
    res.status(404).send("Form not found");
  }
});

// -------- Update (auth + owner) --------
router.put("/forms/:id", requireAuth, async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id))
      return res.status(403).send("Forbidden");

    const {
      name,
      rankType,
      rankNumber,
      beltColor,
      category,
      description,
      referenceUrl,
      learned,
    } = req.body;

    const exists = await Form.exists({
      _id: { $ne: req.params.id },
      owner: req.session.user._id,
      name,
      rankType,
      rankNumber: Number(rankNumber),
      deletedAt: null,
    });
    if (exists) {
      return res.status(400).render("forms/edit", {
        title: `Edit: ${form.name}`,
        form,
        error: "That form already exists for this rank.",
        errors: {},
        formData: req.body,
      });
    }

    await Form.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          rankType,
          rankNumber: Number(rankNumber),
          beltColor: beltColor || undefined,
          category: category || "Kata",
          description: description || "",
          referenceUrl: referenceUrl || undefined,
          learned: learned === "on",
        },
      },
      { runValidators: true }
    );

    res.redirect(`/forms/${req.params.id}`);
  } catch (err) {
    if (err.name === "ValidationError") {
      const f = await Form.findById(req.params.id);
      return res.status(400).render("forms/edit", {
        title: `Edit: ${f?.name || "Form"}`,
        form: f,
        error: null,
        errors: formatErrors(err),
        formData: req.body,
      });
    }
    next(err);
  }
});

// -------- Destroy (soft) / Hard delete (auth + owner) --------
router.delete("/forms/:id", requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id))
      return res.status(403).send("Forbidden");

    const hard = req.query.hard === "1" || req.body.hard === "1";
    if (hard) {
      await Form.deleteOne({ _id: req.params.id });
      console.log(`[DEBUG] Hard deleted form ${req.params.id}`);
      return res.redirect("/forms/trash");
    }
    const result = await Form.updateOne(
      { _id: req.params.id },
      { $set: { deletedAt: new Date() } }
    );
    console.log(
      `[DEBUG] Soft deleted form ${req.params.id}, update result:`,
      result
    );
    res.redirect("/forms/trash");
  } catch {
    res.status(400).send("Failed to delete form");
  }
});

// -------- Restore (auth + owner) --------
router.post("/forms/:id/restore", requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id))
      return res.status(403).send("Forbidden");

    await Form.updateOne({ _id: req.params.id }, { $set: { deletedAt: null } });
    res.redirect("/forms/trash");
  } catch {
    res.status(400).send("Failed to restore form");
  }
});

// -------- Show (public read) --------
router.get("/forms/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
    res.render("forms/show", { title: form.name, form });
  } catch {
    res.status(404).send("Form not found");
  }
});

module.exports = router;
