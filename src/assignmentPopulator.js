const CanvasAPI = require('@kth/canvas-api');
const { Client } = require('@notionhq/client');
const moment = require('moment-timezone');
const { getEmoji } = require('./emojiUtil.js');

require('dotenv').config();

const TIME_ZONE = 'America/New_York';
const SEARCH_NUMBER_LIMIT = 45;
const COURSE_NAME_LENGTH = 7;

const canvas = new CanvasAPI(
  `https://${process.env.CANVAS_ORGANIZATION_TITLE}.instructure.com/api/v1/`,
  process.env.CANVAS_API_KEY
);

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// obj for storing assignments
function Assignment(name, courseName, dueDate) {
  this.name = name;
  this.courseName = courseName;
  this.dueDate = dueDate;
}

// fetching assignments using Canvas API and returning a list of assignment objects
async function getCanvasData(courseID, searchType, searchNumLimit) {
  // fetching course name
  // assumes course name starts with the 7 character course id (ie. COP3530)
  const courseNameResponse = await canvas.get(`courses/${courseID}`);
  const courseName = courseNameResponse.body.name.substring(
    0,
    COURSE_NAME_LENGTH
  );

  // fetching assignment data
  const assignmentsResponse = await canvas.get(
    `courses/${courseID}/${searchType}`,
    { per_page: searchNumLimit }
  );
  const assignments = assignmentsResponse.body;

  // removed assignment if due date has already passed (or invalid format)
  // then maps them to assignment object
  const assignmentsList = assignments.reduce((filtered, possibeAssignment) => {
    const dueDate = moment.utc(possibeAssignment.due_at).tz(TIME_ZONE);
    if (dueDate.format() !== 'Invalid date' && moment() < dueDate) {
      filtered.push(
        new Assignment(possibeAssignment.name, courseName, dueDate.format())
      );
    }
    return filtered;
  }, []);

  return assignmentsList;
}

// post assignments to notion database
async function postToNotion(courseId, searchType, searchNumLimit) {
  // fetching data from Canvas
  const assignments = await getCanvasData(courseId, searchType, searchNumLimit);

  // posting to notion
  assignments.forEach((assignment) => {
    // assigning emoji
    const emoji = getEmoji(assignment.name);

    notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        [process.env.NOTION_NAME_ID]: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: `~ ${assignment.name}`,
              },
            },
          ],
        },
        [process.env.NOTION_DATE_ID]: {
          type: 'date',
          date: {
            start: assignment.dueDate,
          },
        },
        [process.env.NOTION_MULTI_ID]: {
          type: 'multi_select',
          multi_select: [
            {
              name: assignment.courseName,
            },
          ],
        },
      },
      icon: {
        type: 'emoji',
        emoji,
      },
    });
  });
}

// deletes the first 100 items in the database (capped by Notion API)
async function clearDatabase() {
  const databaseQuery = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
  });
  const assignments = databaseQuery.results;

  assignments.forEach((assignment) => {
    const pageProps = assignment.properties;
    const pageTitle = pageProps[Object.keys(pageProps)[2]].title;

    // removing blank pages
    if (pageTitle.length === 0) {
      notion.pages.update({
        page_id: assignment.id,
        archived: true,
      });
    } else if (pageTitle[0].plain_text.includes('~')) {
      // removing pages with "~" key
      notion.pages.update({
        page_id: assignment.id,
        archived: true,
      });
    }
  });
}

// running script
(async () => {
  await clearDatabase();

  const courseIds = process.env.COURSE_ID_LIST.split(',');
  courseIds.forEach((courseId) =>
    postToNotion(courseId, 'assignments', SEARCH_NUMBER_LIMIT)
  );
})();
