const { Client } = require('@notionhq/client');
const { getEmoji } = require('./emoji-util.js');
const { getCanvasData } = require('./canvas-util');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// =================================
// adds assignments to the given set
// =================================
const appendToSet = (set, assignment) => {
  let name = assignment.properties[process.env.NOTION_NAME_ID].title[0];
  name = name ? name.plain_text : 'NO NAME';
  let course =
    assignment.properties[process.env.NOTION_MULTI_ID].multi_select[0];
  course = course ? course.name : 'NO COURSE';

  const identifier = `${name} (${course})`;

  set.add(identifier);
};

// ===================================================
// stores the names of each Notion assignment in a set
// ===================================================
const logPrevAssignments = async () => {
  let set = new Set();

  try {
    let databaseQuery = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
    });

    // logging data
    databaseQuery.results.forEach((assignment) => {
      appendToSet(set, assignment);
    });

    // while there is more data to log
    while (databaseQuery.has_more) {
      databaseQuery = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        start_cursor: databaseQuery.next_cursor,
      });

      // logging data
      databaseQuery.results.forEach((assignment) => {
        appendToSet(set, assignment);
      });
    }
  } catch (err) {
    console.error('Error from Notion Database Logger: ', err.message);
  }

  return set;
};

// ===================================
// post assignments to notion database
// ===================================
exports.postToNotion = async (
  courseId,
  searchType,
  searchNumLimit,
  timeZone,
  courseNameLength
) => {
  try {
    // fetching data from Canvas
    const assignments = await getCanvasData(
      courseId,
      searchType,
      searchNumLimit,
      timeZone,
      courseNameLength
    );

    // loading previous assignments
    const alreadyLoggedAssignments = await logPrevAssignments();
    console.log(alreadyLoggedAssignments);

    // posting to notion
    assignments.forEach((assignment) => {
      // do not post assignment if already logged
      if (
        alreadyLoggedAssignments.has(
          `${assignment.name} (${assignment.courseName})`
        )
      )
        return;

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
                  content: assignment.name,
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
  } catch (err) {
    console.error('Error from Notion Poster: ', err.message);
  }
};

// deletes the first 100 items in the database (capped by Notion API)
exports.clearDatabase = async () => {
  try {
    const databaseQuery = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    const assignments = databaseQuery.results;

    assignments.forEach((assignment) => {
      const pageProps = assignment.properties;
      const pageTitle = pageProps[process.env.NOTION_NAME_ID].title;

      // removing blank pages
      if (pageTitle.length === 0) {
        notion.pages.update({
          page_id: assignment.id,
          archived: true,
        });
      }
      // removing pages with "~" key
      else if (pageTitle[0].plain_text.includes('~')) {
        notion.pages.update({
          page_id: assignment.id,
          archived: true,
        });
      }
    });
  } catch (err) {
    console.error('Error from Notion Database Clearer: ', err.message);
  }
};

// ================================
// archives all checked assignments
// ================================
exports.removeChecked = async () => {
  // epic stuff soon to come
};
