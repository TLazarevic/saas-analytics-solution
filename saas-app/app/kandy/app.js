const { PrismaClient } = require('@prisma/client');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var workspaceRouter = require('./routes/workspaces');
var boardsRouter = require('./routes/boards');
var subscriptionRouter = require('./routes/subscriptions');
var userRouter = require('./routes/users');

const auth = require('./middleware/auth');

var schedule = require('node-schedule');

var userDeletion = schedule.scheduleJob('0 * * * *', function deleteOldUsers() {
  let current = new Date();
  current.setDate(current.getDate() - 30);

  prisma.users.deleteMany({
    where: {
      deleted_at: {
        lte: current
      }
    }
  }).then(() => {
    console.log("Successfully executed scheduled users deletion.");
  }).catch(err => {
    console.log("Error while running scheduled users deletion: " + err);
  });
});

const prisma = new PrismaClient()
var app = express();
var favicon = require('serve-favicon');

app.use(express.json());
app.use('/public', express.static('public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/workspaces', auth, workspaceRouter);
app.use('/boards', auth, boardsRouter);
app.use('/subscriptions', auth, subscriptionRouter);
app.use('/users', auth, userRouter);

app.use(function (req, res, next) {
  res.status(404).render('404');
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

