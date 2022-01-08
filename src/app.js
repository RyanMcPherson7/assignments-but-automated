const { postToNotion, clearDatabase } = require('./notion-util');

const SEARCH_TYPE = 'assignments';
const SEARCH_NUMBER_LIMIT = 100;
const TIME_ZONE = 'America/New_York';
const COURSE_NAME_LENGTH = 7;

// running script
(async () => {
  await clearDatabase();

  // test commit

  const courseIds = process.env.COURSE_ID_LIST.split(',');
  courseIds.forEach((courseId) =>
    postToNotion(
      courseId,
      SEARCH_TYPE,
      SEARCH_NUMBER_LIMIT,
      TIME_ZONE,
      COURSE_NAME_LENGTH
    )
  );
})();
