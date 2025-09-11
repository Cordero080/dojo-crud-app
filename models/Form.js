// models/Form.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const formSchema = new Schema(
  {
    // === CHANGED FOR AUTH ===
    // Link each Form to the User who created it.
    // You'll set this in routes using: req.session.user._id
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"], // ensures every Form belongs to a user
      index: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
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
    beltColor: { type: String, trim: true },
    category: {
      type: String,
      enum: {
        values: ["Kata", "Bunkai", "Kumite", "Weapon", "Other"],
        message: "Category must be one of Kata, Bunkai, Kumite, Weapon, Other",
      },
      default: "Kata",
      trim: true,
    },
    description: { type: String, default: "" },
    referenceUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\//i.test(v),
        message: "Reference URL must start with http:// or https://",
      },
    },
    learned: { type: Boolean, default: false },

    // Soft delete flag
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/*
 * === CHANGED FOR AUTH ===
 * Make "alive" Forms unique PER USER instead of globally.
 * Old (pre-auth) index was: { name, rankType, rankNumber } unique (alive only).
 * New compound index adds { owner }, so two different users can store the same form.
 */
formSchema.index(
  { owner: 1, name: 1, rankType: 1, rankNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// (optional) query helpers for cleaner code — unchanged
formSchema.query.alive = function () {
  return this.where({ deletedAt: null });
};
formSchema.query.trashed = function () {
  return this.where({ deletedAt: { $ne: null } });
};

module.exports = require('mongoose').models.Form || require('mongoose').model('Form', formSchema);

