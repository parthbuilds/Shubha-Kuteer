// /api/index.js
const app = require("../backend/index"); 
const serverless = require("serverless-http");

module.exports = app;
module.exports.handler = serverless(app);
