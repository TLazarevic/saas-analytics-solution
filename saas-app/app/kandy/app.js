const { PrismaClient } = require('@prisma/client');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var boardsRouter = require('./routes/boards');


const prisma = new PrismaClient()
var app = express();
app.use(express.json());
app.use('/public', express.static('public'));

var favicon = require('serve-favicon');

// endpoints
app.get('/users/:userId/workspaces', async (req, res) => {
  const userId = req.params.userId;

  try {
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deleted_at: null, workspace_members: { some: { user_id: userId } }
      }, include: {
        boards: true
      }
    })

    res.json(workspaces);
  } catch (error) {
    console.error('Error retrieving workspaces:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.put('/users/:userId/workspaces/:workspaceId', async (req, res) => {
  const userId = req.params.userId;
  const workspaceID = req.params.workspaceId;

  try {
    const workspaces = await prisma.workspaces.create({
      data: req.body
    })

    res.json(workspaces);
  } catch (error) {
    console.error('Error retrieving workspaces:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/boards', boardsRouter);

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

