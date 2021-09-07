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


// obj for storing assignments
function Assignment(name, courseName, dueDate) {
    this.name = name;
    this.courseName = courseName;
    this.dueDate = dueDate;
}

// fetching assignments using Canvas API and returning a list of assignment objects
async function getCanvasData(courseID, searchType, searchNumLimit) {

    let assignmentsList = [];

    // fetching course name
    // assumes course name starts with the 7 character course id (ie. COP3530)
    const courseNameResponse = await canvas.get(`courses/${courseID}`);
    const courseName = courseNameResponse.body.name.substring(0, 7);

    // fetching assignment data
    const response = await canvas.get(`courses/${courseID}/${searchType}`, {"per_page": searchNumLimit});
    const data = response.body;

    for (let i = 0; i< data.length; i++) {

        const dueDate = moment.utc(data[i].due_at).tz("America/New_York");

        // adding assignment if has a due date and due date has not already passed
        if (dueDate.format() != "Invalid date" 
            && moment() < dueDate) {
            const newAssignment = new Assignment(
                data[i].name,
                courseName,
                dueDate.format()
            )
            assignmentsList.push(newAssignment);
        }
    }
    return assignmentsList;
}


// post assignments to notion database
async function postToNotion(courseId, searchType, searchNumLimit) {

    // fetching data from Canvas
    const assignmentList = await getCanvasData(courseId, searchType, searchNumLimit);
    
    // posting to notion
    for (let i = 0; i < assignmentList.length; i++) {
        notion.pages.create({
            parent: {
                database_id: process.env.NOTION_DATABASE_ID,
            },
            properties: {
                [process.env.NOTION_NAME_ID]: {
                    type: "title",
                    title: [
                        {
                            type: "text",
                            text: {
                                content: assignmentList[i].name
                            }
                        }
                    ]
                },
                [process.env.NOTION_DATE_ID]: {
                    type: "date",
                    date: {
                            start: assignmentList[i].dueDate
                    }
                },
                [process.env.NOTION_MULTI_ID]: {
                    type: "multi_select",
                    "multi_select": [
                        {
                            "name": assignmentList[i].courseName
                        }
                    ]
                }
            }
        });
    }
}

// deletes the first 100 items in the database (capped by API)
async function clearDatabase() {

    const database = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
    })
    const assignmentList = database.results;

    for (let i = 0; i < assignmentList.length; i++) {

        const pageProps = assignmentList[i].properties;

        // removing blank pages 
        if (pageProps[Object.keys(pageProps)[2]].title.length == 0) {
            notion.pages.update({
                page_id: assignmentList[i].id,
                archived: true
            })
            continue;
        }

        // if not blank, remove if title does not contain keyword
        const pageTitle = pageProps[Object.keys(pageProps)[2]].title[0].plain_text;

        if (!pageTitle.includes(process.env.IGNORE_CLEAR_KEYWORD)) {
            notion.pages.update({
                page_id: assignmentList[i].id,
                archived: true
            })
        }
    }
}

// running script
(async () => {
    await clearDatabase();

    const courseIdList = process.env.COURSE_ID_LIST.split(",");
    for (let i = 0; i < courseIdList.length; i++)
        postToNotion(courseIdList[i], "assignments", 45);
})();