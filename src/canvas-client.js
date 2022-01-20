const moment = require('moment-timezone');
const { Assignment } = require('./models/Assignment');
require('dotenv').config();

// ===============================================================================
// fetching Canvas assignments and returning a list of filtered assignment objects
// ===============================================================================
exports.getCanvasData = async (canvasClient, courseId) => {
  try {
    if (courseId === '') return [];

    // fetching course name
    const courseNameRes = await canvasClient.get(`courses/${courseId}`);
    const courseName = courseNameRes.body.name.substring(
      0,
      process.env.CANVAS_COURSE_NAME_LENGTH
    );

    // fetching assignment data
    const AssignmentsRes = await canvasClient.get(
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
          new Assignment(
            assignment.name,
            courseName,
            dueDate.format(),
            assignment.html_url
          )
        );
    });

    return filteredAssignments;
  } catch (err) {
    console.error('Error from Canvas Getter:', err.message);
  }
};
