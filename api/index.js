
const { createApp } = require("../server.js");
const path = require("path");

const dbPath = process.env.PATHORA_DB || "/tmp/pathora.db";

const { server } = createApp(
  dbPath,
  process.env.ADMIN_EMAIL || ""
);

module.exports = (req, res) => {
  server.emit("request", req, res);
};
