//const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

// Returns all users
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError('Error retrieving users', 500);
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

/***************************************
 * CREATE A NEW USER
 ****************************************/
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new HttpError(
      'Invalid inputs passed, please check your data',
      422
    );
    return next(error);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError('Error searching for pre-existing user', 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      `User with email ${email} exists already. Please login instead`,
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('Could not create user, please try again', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Error signing up', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );
  } catch (err) {
    const error = new HttpError('Error signing up', 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

/***************************************
 * USER LOGIN
 ****************************************/
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError('Login failed, please try again later', 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in',
      401
    );
    return next(error);
  }

  let isValidPassword;
  try {
    isValidPassword = false;
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in. Please check your credentials and try again',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in',
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );
  } catch (err) {
    const error = new HttpError('Error Loggin in', 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token
  });
};

module.exports = {
  getUsers,
  signup,
  login
};
