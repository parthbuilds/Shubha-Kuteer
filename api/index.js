// /api/index.js
import serverless from "serverless-http";
import app from "../backend/index.js";

module.exports = app;
module.exports.handler = serverless(app);
