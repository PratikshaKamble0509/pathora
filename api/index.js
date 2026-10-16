const server = require("../server.js");

module.exports = function handler(req, res) {
  server.emit("request", req, res);
};
