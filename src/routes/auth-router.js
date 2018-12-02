'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('http-errors');

const basicAuthMiddleware = require('../lib/basicAuthMiddleware');
const User = require('../model/user');
const logger = require('../lib/logger');

const jsonParser = bodyParser.json();
const router = module.exports = new express.Router();

router.post('/signup', jsonParser, (request, response, next) => {
  if (!request.body.email || !request.body.password || !request.body.securityAnswer) {
    logger.log(logger.INFO, '400 | MISSING SIGNUP PARAMETERS');
    return response.sendStatus(400);
  } // else if each piece needed to create account exists...

  return User.create(
      request.body.email,
      request.body.password,
      request.body.securityQuestion,
      request.body.securityAnswer,
      request.body.isAdmin,
  )
      .then((user) => {
        delete request.body.password;
        logger.log(logger.INFO, 'auth-router - Creating token');
        return user.pCreateToken();
      })
      .then((token) => {
        logger.log(logger.INFO, 'auth-router - returning 200 code and a token');
        return response.json({ token });
      })
      .catch(next);
});

router.get('/login', basicAuthMiddleware, (request, response, next) => {
  // account is standard name on login request object
  if (!request.account) {
    return next(new HttpError(401, 'auth-router - ACCOUNT FAILED'));
  } // else -- attempt to create token
  return request.account.pCreateToken()
      .then((token) => {
        logger.log(logger.INFO, 'Responding with 200 and a TOKEN');
        return response.json({ token });
        // otherwise, next in middleware chain
      }).catch(next);
});
