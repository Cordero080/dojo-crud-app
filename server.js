require("dotenv").config();
const express = require("express");
const methodOverride = require("method-override");
const connectDB = require("./db");
const formsRouter = require("./routes/forms");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// home
app.get("/", (req, res) => {
  res.render("index", { title: "Martial Arts Forms App" });
});

// mount routes for the forms resource (NO '/forms' prefix here)
app.use(formsRouter);

// start
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🐉 🔥 🐉 Server at http://localhost:${PORT} 🐉 🔥 🐉`));
});
