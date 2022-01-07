import dotenv from "dotenv";
import CanvasClient from "./client/canvasClient.js";
import NotionClient from "./client/notionClient.js";

const SEARCH_TYPE = "assignments";
const SEARCH_NUMBER_LIMIT = 45;
const TIME_ZONE = "America/New_York";
const COURSE_NAME_LENGTH = 7;

dotenv.config();

const canvasClient = new CanvasClient(
  process.env.CANVAS_ORGANIZATION_TITLE,
  process.env.CANVAS_API_KEY
);
const notionClient = new NotionClient(process.env.NOTION_API_KEY);

(async () => {
  await notionClient.clearDatabase();

  const courseIds = process.env.COURSE_ID_LIST.split(",");
  courseIds.forEach(async (courseId) => {
    notionClient.postToNotion(
      await canvasClient.getFilteredAssignments(
        courseId,
        SEARCH_TYPE,
        SEARCH_NUMBER_LIMIT,
        TIME_ZONE,
        COURSE_NAME_LENGTH
      )
    );
  });
})();
