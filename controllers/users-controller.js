const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');

const DUMMY_USERS = [
  { id: 'u1', name: 'Mike Smith', email: 'test@test.com', password: 'testers' },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError('Invalid inputs passed, please check your data', 422);
  }

  const { name, email, password } = req.body;
  const createdUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };
  hasUser = DUMMY_USERS.find((u) => u.email === email);
  if (hasUser) {
    const error = new HttpError(
      'Could not create user: email already exists.',
      422
    );
    return next(error);
  }
  DUMMY_USERS.push(createdUser);
  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);
  if (!identifiedUser || identifiedUser.password !== password) {
    const error = new HttpError(
      'Could not find user with supplied email and password',
      401
    );
    return next(error);
  }
  res.json({ message: 'Logged In' });
};

module.exports = {
  getUsers,
  signup,
  login,
};
