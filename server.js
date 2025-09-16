// server.js

// ✅ BEFORE YOU RUN: install security/perf deps
// npm i helmet compression

// [BOOT 1] Load environment variables once at startup (e.g., MONGODB_URI, SESSION_SECRET)
require("dotenv").config();

// [BOOT 2] Import modules once at startup
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const helmet = require("helmet"); // adds security headers (X-Frame-Options, etc.)
const compression = require("compression"); // gzips responses for speed
const path = require("path");

const connectDB = require("./db");
const formsRouter = require("./routes/forms");
const authRouter = require("./routes/auth");

// [BOOT 3] Create the Express app and derive flags once
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// ---------------- CORE APP SETTINGS ----------------

// [BOOT 4] Tell Express to use EJS templates for res.render('view')
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// [BOOT 5] App-wide template variables (available in every EJS render)
app.locals.owner = "Pablo C.";
app.locals.startYear = 2024;
app.locals.year = new Date().getFullYear();
// 🔁 Cache-buster for static links in head.ejs, e.g. /css/main.css?v=<%= cssVersion %>
app.locals.cssVersion = "2.9"; // bump this when you change any CSS

// -------------- SECURITY & PERFORMANCE (MIDDLEWARE) --------------

// [BOOT 6] Remove the default "X-Powered-By: Express" header at startup (minor hardening)
app.disable("x-powered-by");

// [REQ 1] For each request: add standard security headers (CSP is off by default)
// If CSP later blocks inline scripts, you can do: app.use(helmet({ contentSecurityPolicy: false }))
app.use(helmet());

// [REQ 2] For each request: compress response bodies (HTML/CSS/JS/JSON) if client supports gzip/br
app.use(compression());

// -------------- STATIC ASSETS, BODY PARSERS, METHOD OVERRIDE --------------

// [REQ 3] Serve files from /public (e.g., /css/main.css). In prod, cache them.
// NOTE: We keep maxAge short (1d) since you manually bust cache via ?v=<cssVersion>.
app.use(
  express.static("public", {
    maxAge: isProd ? "1d" : 0,
    immutable: false, // allow updates without forever-cache
    etag: true,
  })
);

// [REQ 4] Parse HTML form posts into req.body (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// [REQ 5] Parse JSON bodies into req.body (application/json)
app.use(express.json());

// [REQ 6] Allow browsers to "fake" PUT/DELETE via ?_method= or hidden input named _method
app.use(methodOverride("_method"));

// ---------------- SESSIONS (LOGIN STATE) ----------------

// [BOOT 7] In production (Render/Heroku), trust the first proxy so secure cookies work
if (isProd) app.set("trust proxy", 1);

// [BOOT 8] Optional safety: refuse to boot without a secret in prod
if (isProd && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

// [REQ 7] For each request: load/create session via signed "sid" cookie; attach to req.session
app.use(
  session({
    name: "sid", // cookie name
    secret: process.env.SESSION_SECRET || "dev-secret", // signs cookie (replace in prod)
    resave: false, // don’t rewrite if unchanged
    saveUninitialized: false, // don’t create empty sessions
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // persist in MongoDB
    cookie: {
      httpOnly: true, // JS can’t read cookie (XSS defense)
      sameSite: "lax", // basic CSRF help for normal flows
      secure: isProd, // HTTPS-only in prod
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ---------------- PER-REQUEST LOCALS FOR VIEWS ----------------

// [REQ 8] For each request: expose values to every EJS render that follows
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null; // set by your auth logic on login
  res.locals.showLogoutInNav = true; // default; override in routes if needed
  next();
});

// NOTE: Global back/history arrow helpers removed.
// The only arrows now are the prev/next ones rendered by forms/edit.ejs (and show.ejs if added)
// using prevId/nextId computed in routes/forms.js.

// ---------------- ROUTES ----------------

// [REQ 9] GET /  (home page): adjust locals, then render views/index.ejs
app.get("/", (req, res) => {
  res.locals.showLogoutInNav = false; // hide logout on home
  res.render("index", { title: "DOJO" });
});

// [REQ 10] Mount /auth/* (sign-in, sign-up, sign-out). Handlers run only when path matches.
app.use("/auth", authRouter);

// [REQ 11] Mount forms CRUD routes (e.g., GET /forms, POST /forms, GET /forms/:id, etc.)
app.use(formsRouter);

// ---------------- FALLBACKS & ERROR HANDLING ----------------

// [REQ 12] If no route matched above: 404 handler
// NOTE: Create views/404.ejs, or temporarily switch to res.status(404).send('Not Found')
app.use((req, res) => {
  res.status(404).render("404", { title: "Not Found" });
});

// [REQ 13] Central error handler (last in the chain)
// NOTE: Create views/500.ejs, or use res.status(500).send('Server Error')
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).render("500", { title: "Server Error" });
});

// ---------------- BOOT: DB → LISTEN ----------------

// [BOOT 9] Connect to MongoDB once; only start the HTTP server after DB is ready
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect DB:", err);
    process.exit(1);
  });
