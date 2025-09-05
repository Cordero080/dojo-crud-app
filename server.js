// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const connectDB = require('./db');
const formsRouter = require('./routes/forms');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// core
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// sessions
app.set('trust proxy', 1);
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// locals for all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.showLogoutInNav = true; // default: show logout in nav
  next();
});

// routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'DOJO',
    showLogoutInNav: false, // hide logout in nav on the home page
  });
});
app.use('/auth', authRouter);
app.use(formsRouter);

// boot
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
});
