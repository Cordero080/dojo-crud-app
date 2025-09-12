// models/Form.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Form
 * - Belongs to a user (owner)
 * - One (name, rankType, rankNumber) must be unique *per owner* while alive (not soft-deleted)
 * - Category supports both "Kumite" and "Kiso Kumite" (syllabus wording)
 */
const formSchema = new Schema(
  {
    // Who owns this form (required for auth-scoped queries)
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },

    // Name of the form/kata/etc.
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },

    // Rank info (e.g., Kyu 5, Dan 2)
    rankType: {
      type: String,
      enum: { values: ["Kyu", "Dan"], message: "Rank type must be Kyu or Dan" },
      required: [true, "Rank type is required"],
    },
    rankNumber: {
      type: Number,
      required: [true, "Rank number is required"],
      min: [1, "Rank must be at least 1"],
    },

    // Display color only; normalize to lowercase for consistency
    beltColor: {
      type: String,
      trim: true,
      set: (v) => (typeof v === "string" ? v.toLowerCase() : v),
    },

    // Training category (accept both Kumite and Kiso Kumite)
    category: {
      type: String,
      enum: {
        values: ["Kata", "Bunkai", "Kumite", "Kiso Kumite", "Weapon", "Other"],
        message:
          "Category must be one of Kata, Bunkai, Kumite, Kiso Kumite, Weapon, Other",
      },
      default: "Kata",
      trim: true,
    },

    description: { type: String, default: "" },

    // Optional reference link; must be http(s)
    referenceUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\//i.test(v),
        message: "Reference URL must start with http:// or https://",
      },
    },

    // Progress flag (used by your chart if counting learned=true)
    learned: { type: Boolean, default: false },

    // Soft delete marker (null = alive)
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * Unique per owner while "alive".
 * Lets different users store the same (name, rankType, rankNumber),
 * but prevents duplicates for a single user unless the old one was soft-deleted.
 */
formSchema.index(
  { owner: 1, name: 1, rankType: 1, rankNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Query helpers
formSchema.query.alive = function () {
  return this.where({ deletedAt: null });
};
formSchema.query.trashed = function () {
  return this.where({ deletedAt: { $ne: null } });
};

// Avoid OverwriteModelError in dev/hot-reload
module.exports =
  mongoose.models.Form || mongoose.model("Form", formSchema);
