import dotenv from 'dotenv';
import CanvasClient from './client/canvasClient.js';
import NotionClient from './client/notionClient.js';

const SEARCH_NUMBER_LIMIT = 45;

dotenv.config();

const canvasClient = new CanvasClient(
  process.env.CANVAS_ORGANIZATION_TITLE, process.env.CANVAS_API_KEY,
);
const notionClient = new NotionClient(process.env.NOTION_API_KEY);

(async () => {
  await notionClient.clearDatabase();

  const courseIds = process.env.COURSE_ID_LIST.split(',');
  const searchType = 'assignments';
  courseIds.forEach(async (courseId) => {
    notionClient.postToNotion(await canvasClient.getFilteredAssignments(courseId, searchType, SEARCH_NUMBER_LIMIT))
  });
})();
