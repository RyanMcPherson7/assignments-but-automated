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
function Assignment(name, courseID, dueDate) {
    this.name = name;
    this.courseID = courseID;
    this.dueDate = dueDate;
}

// fetching assignments using Canvas API and returning a list of assignment objects
async function getCanvasData(courseID, searchType, searchNumLimit) {

    let assignmentsList = [];

    // fetching assignment data
    const response = await canvas.get(`courses/${courseID}/${searchType}`, {"per_page": searchNumLimit});
    const data = response.body;

    // adding assignment object to list if it has not been submitted and there exists a due date
    for (let i = 0; i< data.length; i++) {
        if (data[i].has_submitted_submissions == false) {
            const newAssignment = new Assignment(
                data[i].name,
                data[i].course_id,
                moment.utc(data[i].due_at).tz("America/New_York").format()
            )
            if (newAssignment.dueDate != "Invalid date")
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
                            "name": assignmentList[i].courseID.toString()
                        }
                    ]
                }
            }
        });
    }
}


postToNotion("436423", "assignments", 100); //DSA
postToNotion("435549", "assignments", 100); //CLA
postToNotion("437483", "assignments", 100); //Stats
postToNotion("441075", "assignments", 100);  //CMS



