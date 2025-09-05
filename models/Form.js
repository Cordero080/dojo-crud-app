// models/Form.js
const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
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

    // 👇 soft delete flag
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique only for alive docs (deletedAt: null)
formSchema.index(
  { name: 1, rankType: 1, rankNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// (optional) query helpers for cleaner code
formSchema.query.alive = function () {
  return this.where({ deletedAt: null });
};
formSchema.query.trashed = function () {
  return this.where({ deletedAt: { $ne: null } });
};

module.exports = mongoose.model("Form", formSchema);
