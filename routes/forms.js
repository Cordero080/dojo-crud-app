// routes/forms.js
const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const requireAuth = require("../middleware/requireAuth");

// SYLLABUS DATA - Master list of all martial arts forms
const kyuRequirements = {
  10: ["Basic (Kihon, Tando Ku, Fukyu) Kata #1", "Basic Kata #1 Bunkai (both sides)", "Sanchin Kata"],
  9: ["Basic (Kihon, Tando Ku, Fukyu) Kata #2", "Basic Kata #2 Bunkai (both sides)", "Kiso Kumite #1"],
  8: ["Geikisai #1 Kata", "Geikisai #1 Bunkai (both sides)"],
  7: ["Geikisai #2 Kata", "Geikisai #2 Bunkai (both sides)", "Kiso Kumite #2"],
  6: ["Geikisai #3 Kata", "Geikisai #3 Bunkai (both sides)", "Tensho Kata", "Kiso Kumite #3"],
  5: ["Saifa Kata", "Geikiha Kata"],
  4: ["Saifa Bunkai", "Geikiha Bunkai", "Kiso Kumite #4"],
  3: ["Seyunchin Kata", "Kakuha Kata", "Kiso Kumite #5"],
  2: ["Kakuha Bunkai", "Seisan Kata", "Bo Kata #1 - Chi Hon NoKun"],
  1: ["Seisan Bunkai", "Kiso Kumite #6", "Sai Kata #1"],
};

const danRequirements = {
  1: ["Seipai Kata", "Kiso Kumite #7", "Jisien Kumite", "Seipai Kai Sai Kumite", "Sagawa No Kun", "Tonfa Kata"],
  2: ["Shisochin Kata", "Shisochin Kai Sai Kumite", "Sagakawa No Kun", "Tonfa Kata"],
  3: ["Sanseiru Kata", "Sanseiru Kai Sai Kumite", "Shushi No Kun", "Nunchaku Kata"],
  4: ["Kururunfa Kata", "Kururunfa Kai Sai Kumite", "Tsuken No Kun", "Kama Kata"],
  5: ["Pichurin Kata", "Peichurin Kai Sai Kumite", "Nunti-Bo Kata"],
  6: ["Hakatsuru Kata Sho"],
  7: ["Hakatsuru Kata Dai"],
  8: ["Kin Gai Ryu Kakaho Kata", "Kin Gai Ryu #1 Kata", "Kin Gai Ryu #2 Kata", "Knife Kata"],
};

// Combine and sort all forms into single master list
const MASTER_FORMS = [...new Set([
  ...Object.values(kyuRequirements).flat(),
  ...Object.values(danRequirements).flat(),
])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

// HELPER: Get form names user already has
async function getExistingAliveNames(ownerId) {
  const docs = await Form.find({ deletedAt: null, owner: ownerId }).select("name -_id");
  return docs.map((d) => d.name);
}

// HELPER: Filter available forms (legacy function)
function computeAvailableNames(master, existing) {
  const taken = new Set((existing || []).map((s) => String(s).toLowerCase()));
  return (master || []).filter((n) => !taken.has(String(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// HELPER: Convert validation errors to template format
function formatErrors(err) {
  return Object.fromEntries(
    Object.entries(err?.errors || {}).map(([k, v]) => [k, v.message])
  );
}

// HELPER: Get lowercase names of learned forms
async function getLearnedNamesLower(ownerId) {
  const docs = await Form.find({ owner: ownerId, deletedAt: null, learned: true }).select("name -_id");
  return docs.map((d) => String(d.name).toLowerCase());
}

// HELPER: Normalize category input to match schema
function normalizeCategory(c) {
  const raw = String(c || "").trim();
  if (/^kiso\s+kumite$/i.test(raw)) return "Kumite";
  if (/^kumite$/i.test(raw)) return "Kumite";
  if (/^bunkai$/i.test(raw)) return "Bunkai";
  if (/^weapon$/i.test(raw)) return "Weapon";
  if (/^kata$/i.test(raw)) return "Kata";
  return "Other";
}

// HELPER: Normalize belt color to lowercase
function normalizeBeltColor(b) {
  return String(b || "").trim().toLowerCase() || undefined;
}

// HELPER: Generate chart data for progress visualization
async function getChartData(ownerId) {
  const labels = [
    ...Array.from({ length: 10 }, (_, i) => `KYU ${10 - i}`),
    ...Array.from({ length: 8 }, (_, i) => `DAN ${i + 1}`),
  ];
  const counts = new Map(labels.map((l) => [l, 0]));
  const learned = await Form.find({ owner: ownerId, deletedAt: null, learned: true }).select("rankType rankNumber");

  for (const f of learned) {
    const label = `${String(f.rankType).toUpperCase()} ${Number(f.rankNumber)}`;
    if (counts.has(label)) counts.set(label, counts.get(label) + 1);
  }
  return { chartLabels: labels, chartCounts: labels.map((l) => counts.get(l)) };
}

// HELPER: Return requirements objects
function getRequirements() {
  return { kyuRequirements, danRequirements };
}

// HELPER: Return belt color chip mappings
function getKyuChipMap() {
  return {
    10: "chip-white", 9: "chip-white-orange", 8: "chip-orange", 7: "chip-orange-green",
    6: "chip-green", 5: "chip-green-purple", 4: "chip-purple", 3: "chip-purple-brown",
    2: "chip-brown", 1: "chip-black",
  };
}

// HELPER: Assemble all data needed for new form page
async function getNewPageData(ownerId) {
  const [, chart, reqs, learnedNamesLower] = await Promise.all([
    getExistingAliveNames(ownerId),
    getChartData(ownerId),
    Promise.resolve(getRequirements()),
    getLearnedNamesLower(ownerId),
  ]);

  return {
    availableNames: MASTER_FORMS,
    chartLabels: chart.chartLabels,
    chartCounts: chart.chartCounts,
    kyuRequirements: reqs.kyuRequirements,
    danRequirements: reqs.danRequirements,
    kyuChipMap: getKyuChipMap(),
    learnedNamesLower,
  };
}

// HELPER: Calculate prev/next form IDs for navigation arrows
async function computePrevNext(ownerId, currentId) {
  const list = await Form.find({ owner: ownerId, deletedAt: null })
    .sort({ rankType: 1, rankNumber: 1, name: 1 })
    .select("_id");
  const idx = list.findIndex((d) => String(d._id) === String(currentId));
  return {
    prevId: idx > 0 ? list[idx - 1]._id : null,
    nextId: idx >= 0 && idx < list.length - 1 ? list[idx + 1]._id : null,
  };
}

// CREATE FORM: Show new form page
// Middleware: requireAuth (from server.js sessions + req-scoped locals)
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
    console.error("GET /forms/new error:", e);
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
      learnedNamesLower: [],
    });
  }
});

// CREATE FORM: Process form submission
// Middleware: requireAuth, express.urlencoded (body parser), methodOverride
router.post("/forms", requireAuth, async (req, res, next) => {
  const ownerId = req.session.user?._id;

  const renderNew = async ({ error = null, errors = {}, formData = req.body, status = 400 } = {}) => {
    const data = await getNewPageData(ownerId);
    return res.status(status).render("new", {
      title: "Add New Martial Arts Form",
      error, errors, formData, ...data,
    });
  };

  try {
    const { name = "", rankType, rankNumber, beltColor = "", category = "Kata", 
            description = "", referenceUrl = "", learned } = req.body;

    const doc = {
      owner: ownerId,
      name: name.trim(),
      rankType,
      rankNumber: Number(rankNumber),
      beltColor: normalizeBeltColor(beltColor),
      category: normalizeCategory(category),
      description: String(description ?? ""),
      referenceUrl: referenceUrl.trim() || undefined,
      learned: learned === "on",
    };

    if (!Number.isFinite(doc.rankNumber)) {
      return renderNew({ errors: { rankNumber: "Rank number must be a valid number" } });
    }

    const exists = await Form.exists({
      owner: ownerId, name: doc.name, rankType: doc.rankType, 
      rankNumber: doc.rankNumber, deletedAt: null,
    });
    if (exists) {
      return renderNew({ error: "That form already exists for this rank." });
    }

    await Form.create(doc);
    res.redirect("/forms");
  } catch (err) {
    if (err?.code === 11000) return renderNew({ error: "That form already exists for this rank." });
    if (err?.name === "ValidationError") return renderNew({ errors: formatErrors(err) });
    next(err);
  }
});

// READ FORMS: Show all user's forms
// Middleware: sessions, req-scoped locals (currentUser available)
router.get("/forms", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.render("forms/index2", { title: "All Forms", forms: [] });
    }
    const forms = await Form.find({ deletedAt: null, owner: req.session.user._id })
      .sort({ rankType: 1, rankNumber: 1, name: 1 });
    res.render("forms/index2", { title: "All Forms", forms });
  } catch (e) {
    console.error("GET /forms error:", e);
    res.status(500).send("Failed to load forms");
  }
});

// READ FORMS: Show trash/deleted forms
// Middleware: requireAuth, sessions
router.get("/forms/trash", requireAuth, async (req, res) => {
  try {
    const forms = await Form.find({ deletedAt: { $ne: null }, owner: req.session.user._id })
      .sort({ updatedAt: -1 });
    res.render("forms/trash", { title: "Trash", forms });
  } catch {
    res.status(500).send("Failed to load trash");
  }
});

// UPDATE FORM: Show edit form page with navigation arrows
// Middleware: requireAuth, sessions, req-scoped locals
router.get("/forms/:id/edit", requireAuth, async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, deletedAt: null });
    if (!form) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id)) return res.status(403).send("Forbidden");

    const { prevId, nextId } = await computePrevNext(req.session.user._id, form._id);

    res.render("forms/edit", {
      title: `Edit: ${form.name}`,
      form, prevId, nextId,
      error: null, errors: {}, formData: {},
      showBackArrow: false, showHistoryArrows: false,
    });
  } catch {
    res.status(404).send("Form not found");
  }
});

// UPDATE FORM: Process edit form submission
// Middleware: requireAuth, express.urlencoded, methodOverride (PUT via ?_method=PUT)
router.put("/forms/:id", requireAuth, async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id)) return res.status(403).send("Forbidden");

    const { name, rankType, rankNumber, beltColor, category, description, referenceUrl, learned } = req.body;

    const exists = await Form.exists({
      _id: { $ne: req.params.id }, owner: req.session.user._id,
      name, rankType, rankNumber: Number(rankNumber), deletedAt: null,
    });
    if (exists) {
      const { prevId, nextId } = await computePrevNext(req.session.user._id, form._id);
      return res.status(400).render("forms/edit", {
        title: `Edit: ${form.name}`, form, prevId, nextId,
        error: "That form already exists for this rank.",
        errors: {}, formData: req.body, showBackArrow: false, showHistoryArrows: false,
      });
    }

    await Form.findByIdAndUpdate(req.params.id, {
      $set: {
        name, rankType, rankNumber: Number(rankNumber),
        beltColor: normalizeBeltColor(beltColor),
        category: normalizeCategory(category),
        description: description || "",
        referenceUrl: referenceUrl || undefined,
        learned: learned === "on",
      },
    }, { runValidators: true });

    res.redirect(`/forms/${req.params.id}`);
  } catch (err) {
    if (err.name === "ValidationError") {
      const f = await Form.findById(req.params.id);
      let prevId = null, nextId = null;
      if (f) {
        const nav = await computePrevNext(req.session.user._id, f._id);
        prevId = nav.prevId;
        nextId = nav.nextId;
      }
      return res.status(400).render("forms/edit", {
        title: `Edit: ${f?.name || "Form"}`, form: f, prevId, nextId,
        error: null, errors: formatErrors(err), formData: req.body,
        showBackArrow: false, showHistoryArrows: false,
      });
    }
    next(err);
  }
});

// DELETE FORM: Soft delete or hard delete form
// Middleware: requireAuth, methodOverride (DELETE via ?_method=DELETE)
router.delete("/forms/:id", requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id)) return res.status(403).send("Forbidden");

    const hard = req.query.hard === "1" || req.body.hard === "1";
    if (hard) {
      await Form.deleteOne({ _id: req.params.id });
      return res.redirect("/forms/trash");
    }

    await Form.updateOne({ _id: req.params.id }, { $set: { deletedAt: new Date() } });
    res.redirect("/forms/trash");
  } catch {
    res.status(400).send("Failed to delete form");
  }
});

// RESTORE FORM: Undelete soft-deleted form
// Middleware: requireAuth, express.urlencoded
router.post("/forms/:id/restore", requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send("Form not found");
    if (String(form.owner) !== String(req.session.user._id)) return res.status(403).send("Forbidden");

    await Form.updateOne({ _id: req.params.id }, { $set: { deletedAt: null } });
    res.redirect("/forms/trash");
  } catch {
    res.status(400).send("Failed to restore form");
  }
});

// READ FORM: Show single form with navigation arrows
// Middleware: sessions, req-scoped locals (no auth required - public read)
router.get("/forms/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");

    const list = await Form.find({ owner: form.owner, deletedAt: null })
      .sort({ rankType: 1, rankNumber: 1, name: 1 })
      .select("_id");

    const idx = list.findIndex((d) => String(d._id) === String(form._id));
    const prevId = idx > 0 ? list[idx - 1]._id : null;
    const nextId = idx < list.length - 1 ? list[idx + 1]._id : null;

    res.render("forms/show", { title: form.name, form, prevId, nextId });
  } catch {
    res.status(404).send("Form not found");
  }
});

module.exports = router;