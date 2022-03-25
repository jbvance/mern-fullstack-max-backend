const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty().withMessage('cannot be empty'),
    check('email').normalizeEmail().isEmail().withMessage('not a valid email'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('must be at least 6 characters')
  ],
  usersController.signup
);

router.post('/login', usersController.login);

module.exports = router;
