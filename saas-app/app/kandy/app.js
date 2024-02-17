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

const auth = require('./middleware/auth');

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

