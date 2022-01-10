const CanvasAPI = require('@kth/canvas-api');
const { Client } = require('@notionhq/client');
const { runClient } = require('./notion-client');
require('dotenv').config();

const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

const canvasClient = new CanvasAPI(
  `https://${process.env.CANVAS_ORGANIZATION_TITLE}.instructure.com/api/v1/`,
  process.env.CANVAS_API_KEY
);

runClient(notionClient, canvasClient);
