// server.js
require("dotenv").config(); // 1. Load environment variables from .env file first

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override"); //enable PUT and DELETE
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const connectDB = require("./db");
const formsRouter = require("./routes/forms");
const authRouter = require("./routes/auth");

const app = express(); // 2. Create Express application instance
const PORT = process.env.PORT || 3000; // 3. Set port from environment or default
const isProd = process.env.NODE_ENV === "production"; // 4. Check if running in production

// VIEW ENGINE SETUP
app.set("view engine", "ejs"); // 5. Tell Express to use EJS for templates
app.set("views", path.join(__dirname, "views")); // 6. Set template directory location

// APP-WIDE TEMPLATE VARIABLES
app.locals.owner = "Pablo C."; // 7. Available in all EJS templates as <%= owner %>
app.locals.startYear = 2024;
app.locals.year = new Date().getFullYear();
app.locals.cssVersion = "2.9"; // 8. Cache buster - increment to force CSS reload

// SECURITY & PERFORMANCE
app.disable("x-powered-by"); // 9. Remove "X-Powered-By: Express" header for security
app.use(helmet()); // 10. Add security headers (XSS protection, etc.)
app.use(compression()); // 11. Compress responses with gzip to reduce bandwidth

// MIDDLEWARE
app.use(
  express.static("public", {
    // 12. Serve files from /public folder
    maxAge: isProd ? "1d" : 0, // Cache files for 1 day in production
    immutable: false,
    etag: true,
  })
);
app.use(express.urlencoded({ extended: true })); // 13. Parse form data into req.body
app.use(express.json()); // 14. Parse JSON requests into req.body
app.use(methodOverride("_method")); // 15. Allow PUT/DELETE via ?_method= parameter

// SESSIONS
if (isProd) app.set("trust proxy", 1); // 16. Trust first proxy for secure cookies in production
if (isProd && !process.env.SESSION_SECRET) {
  // 17. Ensure session secret exists in production
  throw new Error("SESSION_SECRET is required in production");
}
app.use(
  session({
    // 18. Enable sessions with MongoDB storage
    name: "sid", // Cookie name
    secret: process.env.SESSION_SECRET || "dev-secret", // Signs the session cookie
    resave: false, // Don't save unchanged sessions
    saveUninitialized: false, // Don't create empty sessions
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // Store sessions in MongoDB
    cookie: {
      httpOnly: true, // Prevent JavaScript access to cookie
      sameSite: "lax", // CSRF protection
      secure: isProd, // HTTPS only in production prevents cross script attacks
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
    },
  })
);

// REQUEST-SCOPED LOCALS
app.use((req, res, next) => {
  // 19. Run for every request before routes
  res.locals.currentUser = req.session.user || null; // Make user available in templates
  res.locals.showLogoutInNav = true;
  next(); // Continue to next middleware/route
});

// ROUTES
app.get("/", (req, res) => {
  // 20. Home page route
  res.locals.showLogoutInNav = false; // Override global setting for this page
  res.render("index", { title: "DOJO" }); // Render views/index.ejs
});
app.use("/auth", authRouter); // 21. Mount auth routes at /auth/* paths
app.use(formsRouter); // 22. Mount forms routes at root level

// ERROR HANDLING
app.use((req, res) => {
  // 23. 404 handler - runs if no routes matched
  res.status(404).render("404", { title: "Not Found" });
});
app.use((err, req, res, next) => {
  // 24. Global error handler - 4 parameters required
  console.error(err);
  res.status(500).render("500", { title: "Server Error" });
});

// SERVER STARTUP
connectDB() // 25. Connect to MongoDB first
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // 26. Start HTTP server
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1); // 27. Exit if database connection fails
  });
