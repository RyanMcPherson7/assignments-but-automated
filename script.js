const CanvasAPI = require("@kth/canvas-api");
const moment = require("moment-timezone");
const { Client } = require("@notionhq/client");
require("dotenv").config();

const canvas = new CanvasAPI(
    `https://${process.env.CANVAS_ORGANIZATION_TITLE}.instructure.com/api/v1/`,
    process.env.CANVAS_API_KEY
);

const notion = new Client({
    auth: process.env.NOTION_API_KEY
});
