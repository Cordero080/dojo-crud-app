// middleware/requireAuth.js
module.exports = function requireAuth(req, res, next) {
  if (!req.session?.user) return res.redirect('/auth/login');
  next();
};
