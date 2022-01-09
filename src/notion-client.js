const { Client } = require('@notionhq/client');
const { getEmoji } = require('./emoji-util.js');
const { getCanvasData } = require('./canvas-client');

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
const postToNotion = async (courseId) => {
  try {
    // fetching data from Canvas
    const assignments = await getCanvasData(courseId);

    // loading previous assignments
    const alreadyLoggedAssignments = await logPrevAssignments();

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

// ================================
// archives all checked assignments
// ================================
const removeChecked = async () => {
  try {
    const databaseQuery = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: process.env.NOTION_CHECKBOX_ID,
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    });

    // archiving checked assignments
    databaseQuery.results.forEach((assignment) => {
      notion.pages.update({
        page_id: assignment.id,
        archived: true,
      });
    });
  } catch (err) {
    console.error('Error from Notion Check Remover: ', err.message);
  }
};

// =========================
// run scrapping and posting
// =========================
exports.runNotionClient = () => {
  // posting courses
  const courseIds = process.env.COURSE_ID_LIST.split(',');
  courseIds.forEach((courseId) => postToNotion(courseId));

  // removing checked
  removeChecked();
};
