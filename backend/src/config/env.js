const path = require("path");
const dotenv = require("dotenv");

const result = dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log("ENV file loaded:", !result.error);
console.log("MONGO_URI found:", Boolean(process.env.MONGO_URI));

if (!process.env.MONGO_URI) {
  throw new Error("Missing required env var: MONGO_URI");
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  port: process.env.PORT || 5000,
};