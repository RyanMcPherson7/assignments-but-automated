/* eslint-disable */
require("dotenv").config();
const Canvas = require("../src/index");

async function start() {
  console.log(
    "Checking environmental variables...\n" +
      `- CANVAS_API_URL: ${process.env.CANVAS_API_URL}\n`
  );
  console.log();
  console.log("Making a wrong request");
  const canvas = new Canvas(
    process.env.CANVAS_API_URL,
    process.env.CANVAS_API_TOKEN
  );

  try {
    await canvas.get("nanananana");
  } catch (err) {
    console.log("Displaying `err` object");
    console.error(err);
  }
}

start();
