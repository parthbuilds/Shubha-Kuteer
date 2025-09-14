// /api/index.js
import serverless from "serverless-http";
import app from "../backend/index.js";

export default serverless(app);
