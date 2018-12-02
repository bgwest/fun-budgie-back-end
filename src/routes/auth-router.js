'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('http-errors');

const basicAuthMiddleware = require('../lib/basicAuthMiddleware');
const User = require('../model/user');
const logger = require('../lib/logger');

const jsonParser = bodyParser.json();
const router = module.exports = new express.Router();


