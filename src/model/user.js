'use strict';

// !: = development notes

// package imports
const mongoose = require('mongoose');
const crypto = require('crypto'); // produces random bytes
const jsonWebToken = require('jsonwebtoken'); // actually doing the crypto
const bcrypt = require('bcrypt'); // this handles the hashing
const HttpError = require('http-errors');

const userSchema = mongoose.Schema({
  // email is the username... foregoing use of duplicate identity for this app
  email: {
    type: String,
    required: true,
    unique: true,
  },
  tokenSeed: {
    type: String,
    required: true,
    unique: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  recoveryQuestion: {
    type: String,
    required: true,
  },
  hashedRecoveryAnswer: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
});

// !: can make larger as needed -- starting with 10
const TOKEN_SEED_LENGTH = 128;
function pCreateToken() {
  this.tokenSeed = crypto.randomBytes(TOKEN_SEED_LENGTH).toString('hex');
  return this.save()
      .then((account) => {
        return jsonWebToken.sign({
          tokenSeed: account.tokenSeed,
        }, process.env.APP_SECRET);
      })
      .catch((error) => {
        throw error;
      });
}

function pValidatePassword(unHashedPassword) {
  return bcrypt.compare(unHashedPassword, this.hashedPassword)
      .then((compareResult) => {
        if (!compareResult) {
          throw new HttpError(401, 'compare fail.')
        } // else
        return this;
      }).catch(console.error);
}

// to handle hashing of security Answer in addition to the Password
const HASH_ROUNDS = 10;
function hashSecurityAnswer(answer, callback) {
  const bcryptReturn = bcrypt.hashSync(answer, HASH_ROUNDS);
  return callback(bcryptReturn);
}
function getSecurityHash(answerHash) {
  return answerHash;
}

// assign custom functions to userSchema object on the methods property
userSchema.methods.pCreateToken = pCreateToken;
userSchema.methods.pValidatePassword = pValidatePassword;

// export the userSchema link name
const User = module.exports = mongoose.model('user', userSchema);

User.create = (email, unHashedPassword, recoveryQuestion, unHashedRecoveryAnswer, isAdmin) => {
  const hashedRecoveryAnswer = hashSecurityAnswer(unHashedRecoveryAnswer, getSecurityHash);
  return bcrypt.hash(unHashedPassword, HASH_ROUNDS)
      .then((hashedPassword) => {
        // remove unhashed values from memory
        unHashedPassword = null;
        unHashedRecoveryAnswer = null;
        const tokenSeed = crypto.randomBytes(TOKEN_SEED_LENGTH).toString('hex');
        return new User({
          email,
          tokenSeed,
          hashedPassword,
          recoveryQuestion,
          hashedRecoveryAnswer,
          isAdmin,
        }).save();
      });
};
