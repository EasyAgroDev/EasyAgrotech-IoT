require('dotenv').config();
// ✅ ADD THIS RIGHT HERE
if (!process.env.DB_URI || !process.env.SESSION_SECRET) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressSession = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');


mongoose.set('strictQuery', true);


const app = express();

// ======================
// MongoDB Connection
// ======================
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ======================
// Passport Setup (Admin Authentication)
// ======================
// passport.use(Admin.createStrategy());
// passport.serializeUser(Admin.serializeUser());
// passport.deserializeUser(Admin.deserializeUser());

// ======================
// View engine setup
// ======================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ======================
// Middleware setup
// ======================
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (req.path.startsWith("/app_data")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});


// ======================
// Session setup
// ======================
app.use(expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,   // true ONLY if HTTPS (after Nginx SSL)
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));


app.use(passport.initialize());
app.use(passport.session());

// ======================
// Routes
// ======================
const indexRouter = require('./routes/index');
let usersRouter;

if (fs.existsSync(path.join(__dirname, 'routes', 'users.js'))) {
  usersRouter = require('./routes/users');
  app.use('/users', usersRouter);
}

app.use('/', indexRouter);

// ======================
// 404 and Error Handling
// ======================
app.use((req, res, next) => next(createError(404)));
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});






module.exports = app;   