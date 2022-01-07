const getEmoji = (assignmentName) => {
  let emoji;

  if (assignmentName.includes('Exam')) {
    emoji = '🅾️';
  } else if (assignmentName.includes('Project')) {
    emoji = '🌀';
  } else {
    emoji = '✏️';
  }
  return emoji;
};

export { getEmoji };