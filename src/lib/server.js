'use strict';

// packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// custom files
const logger = require('./logger');
const authRouter = require('../routes/auth-router');
const loggerMiddleware = require('./logger-middleware');
const errorMiddleware = require('./error-middleware');

const app = express();

// apply middleware
app.use(cors({ credential: true }));
// app.use(authRouter);
// "global" middleware
app.use(loggerMiddleware);
app.use(errorMiddleware);

// catch all route...
app.all('*', (request, response) => {
  logger.log(logger.INFO, '404 - catch all');
  return response.sendStatus(404);
});

const server = module.exports = {};
let internalServer = null;

server.start = () => {
  return mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        internalServer = app.listen(process.env.PORT, () => {
          logger.log(logger.INFO, `Server is on at PORT: ${process.env.PORT}`);
        });
      });
};

server.stop = () => {
  return mongoose.disconnect()
      .then(() => {
        return internalServer.close(() => {
          logger.log(logger.INFO, 'The server is OFF.');
        });
      });
};
