'use strict';

const HttpError = require('http-errors');
const jsonWebToken = require('jsonwebtoken');
const User = require('../model/user');

const promisify = curryFunction => (...args) => {
  return new Promise((resolve, reject) => {
    curryFunction(...args, (error, data) => {
      if (error) {
        return reject(error);
      }
      return resolve(data);
    });
  });
};

module.exports = (request, response, next) => {
  if (!request.headers.authorization) {
    return next(new HttpError(400, 'bearer-auth - authorization header missing'));
  }
  const token = request.headers.authorization.split('Bearer ')[1];
  if (!token) {
    return next(new HttpError(400, 'bearer-auth - invalid Bearer format'));
  }
  return promisify(jsonWebToken.verify)(token, process.env.APP_SECRET)
      .then((decryptedToken) => {
        return User.findOne({ tokenSeed: decryptedToken.tokenSeed });
      })
      .then((account) => {
        if (!account) {
          return next(new HttpError(400, 'bearer-auth - token match failed'));
        }
        request.account = account;
        return next();
      })
      .catch(next);
};
