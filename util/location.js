const axios = require('axios');
const HttpError = require('../models/http-error');
const API_KEY = 'sljfaslkdfjasdlkjfsdaslkdjfasdlkj';

async function getCoordsForAddress(address) {
  // const url = 'INSERT GOOGLE ADDRESS HERE';
  // const response = await axios.get(url);
  // const data = response.data;
  // if (!data || data.status === 'ZERO_RESULTS') {
  //   const error = new HttpError('Could not find location', 422);
  //   throw error;
  // }

  // const coordinates = data.results[0].geometry.location;
  // return coordinates;

  //return promise to fake api http call above - not using above code because I don't want to set up a goodle account
  return {
    lat: 40.7484474,
    lng: -73.9871516,
  };
}

module.exports = getCoordsForAddress;
