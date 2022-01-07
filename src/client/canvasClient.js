import CanvasAPI from "@kth/canvas-api";
import moment from "moment-timezone";
import Assignment from "../models/Assignment.js";
class CanvasClient {
  constructor(organizationTitle, canvasApiKey) {
    this.api = new CanvasAPI(
      `https://${organizationTitle}.instructure.com/api/v1/`,
      canvasApiKey
    );
  }

  async getFilteredAssignments(
    courseId,
    searchType,
    searchNumLimit,
    timeZone,
    courseNameLength
  ) {
    try {
      if (courseId === "") {
        return [];
      }

      // fetching course name
      const courseNameResponse = await this.api.get(`courses/${courseId}`);
      const courseName = courseNameResponse.body.name.substring(
        0,
        courseNameLength
      );

      // fetching assignment data
      const assignmentsResponse = await this.api.get(
        `courses/${courseId}/${searchType}`,
        { per_page: searchNumLimit }
      );
      const assignments = assignmentsResponse.body;

      // removed assignment if due date has already passed (or invalid format)
      // then maps them to assignment object
      const assignmentsList = assignments.reduce(
        (filtered, possibeAssignment) => {
          const dueDate = moment.utc(possibeAssignment.due_at).tz(timeZone);
          if (dueDate.format() !== "Invalid date" && moment() < dueDate) {
            filtered.push(
              new Assignment(
                possibeAssignment.name,
                courseName,
                dueDate.format()
              )
            );
          }
          return filtered;
        },
        []
      );

      return assignmentsList;
    } catch (err) {
      console.error("Error from Canvas Getter:", err.message);
    }
  }
}

export default CanvasClient;
