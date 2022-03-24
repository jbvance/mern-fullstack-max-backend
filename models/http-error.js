class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Add the "message" property to the base class
    this.code = errorCode;
  }
}

module.exports = HttpError;
