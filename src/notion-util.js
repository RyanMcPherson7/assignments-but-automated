const { Client } = require('@notionhq/client');
const { getEmoji } = require('./emoji-util.js');
const { getCanvasData } = require('./canvas-util');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// post assignments to notion database
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
  } catch (err) {
    console.error('Error from Notion Poster:', err.message);
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
      const pageTitle = pageProps[Object.keys(pageProps)[2]].title;

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
    console.log('Error from Notion Database Clearer', err.message);
  }
};
