// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// ---- GET signup
router.get("/signup", (_req, res) => {
  res.render("auth/signup", { title: "Sign Up" });
});

// ---- POST signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) { // this does a few things: trims whitespace, checks for empty strings and null/undefined
      return res.status(400).render("auth/signup", {
        title: "Sign Up",
        error: "Email and password are required.",
      });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() }); // find if email already exists and normalize it. Normalizing means making it consistent (lowercase, trimmed)
    if (existing) {
      return res.status(400).render("auth/signup", {
        title: "Sign Up",
        error: "Email already in use.",
      });
    }
    //  A hashed password is a password that has been converted into a fixed-length, irreversible string using a cryptographic algorithm to securely store and protect it from unauthorized access.
    const passwordHash = await bcrypt.hash(password, 12);
    // bcrypt is a password-hashing function that securely converts plain-text passwords into hashed strings using a slow, salted(unique random string) algorithm to protect against brute-force attacks.
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    req.session.user = { _id: user._id, email: user.email };
    req.session.save(() => {
      res.redirect("/"); // Redirects user to home when logged in
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).render("auth/signup", {
      title: "Sign Up",
      error: "Something went wrong. Try again.",
    });
  }
});

// ---- GET login
router.get("/login", (_req, res) => {
  res.render("auth/login", { title: "Log In" });
});

// ---- POST login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user)
      return res.status(400).render("auth/login", {
        title: "Log In",
        error: "Invalid credentials.",
      });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(400).render("auth/login", {
        title: "Log In",
        error: "Invalid credentials.",
      });

    req.session.user = { _id: user._id, email: user.email };
    req.session.save(() => {
      res.redirect("/");
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).render("auth/login", {
      title: "Log In",
      error: "Something went wrong. Try again.",
    });
  }
});

// ---- POST logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

module.exports = router;
