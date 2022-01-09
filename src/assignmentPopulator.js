import dotenv from 'dotenv';
import config from 'config';
import CanvasClient from './client/canvasClient.js';
import NotionClient from './client/notionClient.js';

const SEARCH_TYPE = 'assignments';
const SEARCH_NUMBER_LIMIT = 45;
const TIME_ZONE = 'America/New_York';
const COURSE_NAME_LENGTH = 7;

const populatorConfig = config.get('populator');

dotenv.config();
class AssignmentPopulator {
  constructor() {
    this.canvasClient = new CanvasClient(
      populatorConfig.canvasOrganizationTitle,
      populatorConfig.canvasAPIKey,
    );
    this.notionClient = new NotionClient(populatorConfig.notionAPIKey, populatorConfig.notionDatabaseID, populatorConfig.notionNameID, populatorConfig.notionDateID, populatorConfig.notionMultiID);
  }

  async run() {
    await this.notionClient.clearDatabase();

    const courseIds = populatorConfig.courseIDList.split(',');
    courseIds.forEach(async (courseId) => {
      this.notionClient.postToNotion(
        await this.canvasClient.getFilteredAssignments(
          courseId,
          SEARCH_TYPE,
          SEARCH_NUMBER_LIMIT,
          TIME_ZONE,
          COURSE_NAME_LENGTH,
        ),
      );
    });
  }
}

export default AssignmentPopulator;
