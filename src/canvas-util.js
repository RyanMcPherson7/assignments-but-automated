const CanvasAPI = require('@kth/canvas-api');
const moment = require('moment-timezone');
require('dotenv').config();

const canvas = new CanvasAPI(
  `https://${process.env.CANVAS_ORGANIZATION_TITLE}.instructure.com/api/v1/`,
  process.env.CANVAS_API_KEY
);

// object format for storing assignments
function Assignment(name, courseName, dueDate) {
  this.name = name;
  this.courseName = courseName;
  this.dueDate = dueDate;
}

// fetching Canvas assignments and returning a list of filtered assignment objects
exports.getCanvasData = async (courseId) => {
  try {
    if (courseId === '') return [];

    // fetching course name
    const courseNameRes = await canvas.get(`courses/${courseId}`);
    const courseName = courseNameRes.body.name.substring(
      0,
      process.env.CANVAS_COURSE_NAME_LENGTH
    );

    // fetching assignment data
    const AssignmentsRes = await canvas.get(
      `courses/${courseId}/${process.env.CANVAS_SEARCH_TYPE}`,
      {
        per_page: process.env.CANVAS_SEARCH_NUMBER_LIMIT,
      }
    );
    const assignments = AssignmentsRes.body;

    // filtering out assignments without due dates and
    // those whose due date has already passed
    let filteredAssignments = [];
    assignments.forEach((assignment) => {
      const dueDate = moment.utc(assignment.due_at).tz(process.env.TIME_ZONE);
      if (dueDate.format() !== 'Invalid date' && moment() < dueDate)
        filteredAssignments.push(
          new Assignment(assignment.name, courseName, dueDate.format())
        );
    });

    return filteredAssignments;
  } catch (err) {
    console.error('Error from Canvas Getter:', err.message);
  }
};
