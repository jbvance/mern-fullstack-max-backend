const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'A tall skyscrcaper',
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: '20 W 34th St., New York, NY 10001',
    creator: 'u1',
  },
];

const getPlaceById = (req, res, next) => {
  const { pid } = req.params;
  const place = DUMMY_PLACES.find((p) => p.id === pid);
  if (!place) {
    const error = new HttpError(
      'Could not find a place for the provided id',
      404
    );
    return next(error);
  }
  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const { uid } = req.params;
  const places = DUMMY_PLACES.filter((p) => p.creator === uid);
  if (!places || places.length === 0) {
    const error = new HttpError(
      'Could not find any places for the provided user id',
      404
    );
    return next(error);
  }
  res.json({ places });
};

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

  const createdPlace = {
    id: uuidv4(),
    title,
    description,
    location: coordinates,
    address,
    creator,
  };
  DUMMY_PLACES.push(createdPlace);
  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError('Invalid inputs passed, please check your data', 422);
  }
  const { title, description } = req.body;
  const { pid } = req.params;
  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === pid) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === pid);
  updatedPlace.title = title;
  updatedPlace.description = description;
  DUMMY_PLACES[placeIndex] = updatedPlace;
  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
  const { pid } = req.params;
  if (!DUMMY_PLACES.find((p) => p.id === pid)) {
    throw new HttpError('Could not find a place with that id', 404);
  }
  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== pid);
  res.status(200).json({ message: 'Deleted place' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
