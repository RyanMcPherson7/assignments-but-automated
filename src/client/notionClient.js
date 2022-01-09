import { Client } from '@notionhq/client';
import { getEmoji } from '../util/emojiUtil.js';

class NotionClient {
  constructor(notionApiKey) {
    this.api = new Client({
      auth: notionApiKey,
    });
  }

  // post assignments to notion database
  async postToNotion(assignments) {
    // posting to notion
    assignments.forEach((assignment) => {
      // assigning emoji
      const emoji = getEmoji(assignment.name);

      this.api.pages.create({
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
  async clearDatabase() {
    try {
      const databaseQuery = await this.api.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
      });
      const assignments = databaseQuery.results;

      assignments.forEach((assignment) => {
        const pageProps = assignment.properties;
        const pageTitle = pageProps.Name.title;

        // removing blank pages
        if (pageTitle.length === 0) {
          this.api.pages.update({
            page_id: assignment.id,
            archived: true,
          });
        }
        // removing pages with "~" key
        else if (pageTitle[0].plain_text.includes('~')) {
          this.api.pages.update({
            page_id: assignment.id,
            archived: true,
          });
        }
      });
    } catch (err) {
      console.log('Error from Notion Database Clearer', err.message);
    }
  }
}

export default NotionClient;
