const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongoose = require('mongoose');

const getPlaceById = async (req, res, next) => {
  const { pid } = req.params;
  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    const error = new HttpError('Error finding place', 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'Could not find a place for the provided id',
      404
    );
    return next(error);
  }

  // return found place
  res.json({ place: place.toObject({ getters: true }) });
};

/********************************
 * FIND A PLACE BY USER ID
 *******************************/
const getPlacesByUserId = async (req, res, next) => {
  const { uid } = req.params;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(uid).populate('places');
  } catch (err) {
    console.log(err);
    const error = new HttpError('Error finding places for user id', 500);
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    const error = new HttpError(
      'Could not find any places for the provided user id',
      404
    );
    return next(error);
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    )
  });
};

// Create a new Place
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/5/57/The_Empire_State_Building_%2812%29.jpg',
    creator
  });

  // check for an existing user
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  try {
    // use a session and transaction to roll back in case one of the operations fails
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  // created successfully
  res.status(201).json({ place: createdPlace.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new HttpError(
      'Invalid inputs passed, please check your data',
      422
    );
    return next(error);
  }
  const { title, description } = req.body;
  const { pid } = req.params;

  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    const error = new HttpError('Error finding place to update', 500);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError('Error updating place', 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

/*******************************
 * DELETE A PLACE
 *******************************/
const deletePlace = async (req, res, next) => {
  const { pid } = req.params;
  let place;

  try {
    place = await Place.findById(pid).populate('creator');
  } catch (err) {
    const error = new HttpError('Error finding place id for deletion', 500);
    return next(error);
  }

  //Check whether the place exists
  if (!place) {
    const error = new HttpError(`Could not find place with id: ${pid}`, 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction({ session: sess });
  } catch (err) {
    const error = new HttpError(`Error deleting place with id: ${pid}`, 500);
    return next(error);
  }
  res.status(200).json({ message: 'Deleted place' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
