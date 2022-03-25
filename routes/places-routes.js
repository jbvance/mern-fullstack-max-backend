const express = require('express');
const { check } = require('express-validator');

const placesController = require('../controllers/places-controller');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

router.post(
  '/',
  fileUpload.single('image'),
  [
    (check('title').not().isEmpty().withMessage('cannot be empty.'),
    check('description')
      .isLength({ min: 5 })
      .withMessage('must be at least 5 characters'),
    check('address').not().isEmpty().withMessage('cannot be empty'))
  ],
  placesController.createPlace
);

router.patch(
  '/:pid',
  [
    check('title').not().isEmpty().withMessage('cannot be empty'),
    check('description')
      .isLength({ min: 5 })
      .withMessage('must be at least 5 characters')
  ],
  placesController.updatePlace
);

router.delete('/:pid', placesController.deletePlace);

module.exports = router;
