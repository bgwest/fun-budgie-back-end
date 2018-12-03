'use strict';

const HttpError = require('http-errors');
const User = require('../model/user');

module.exports = (request, response, next) => {
  if (!request.headers.authorization) {
    return next(new HttpError(400, 'AUTH FAILED - Invalid Request'));
  } // else

  const base64AuthHeader = request.headers.authorization.split('Basic ')[1];
  if (!base64AuthHeader) {
    return next(new HttpError(400, 'AUTH FAILED | Could not spilt header'));
  } // else

  const stringAuthHeader = Buffer.from(base64AuthHeader, 'base64').toString();
  const [email, password] = stringAuthHeader.split(':');

  if (!email || !password) {
    return next(new HttpError(400, 'AUTH FAILED | Email or Password is missing'));
  } // else ...

  return User.findOne({ email })
      .then((account) => {
        if (!account) {
          return next(new HttpError(400, 'ACCOUNT NOT FOUND'));
        } // else...
        return account.pValidatePassword(password);
      })
      .then((account) => {
        request.account = account;
        return next();
      }) // or ...
      .catch(next);
};
