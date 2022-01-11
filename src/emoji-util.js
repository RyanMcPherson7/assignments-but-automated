exports.getEmoji = (assignmentName) => {
  let emoji;

  if (assignmentName.includes('Quiz') || assignmentName.includes('quiz'))
    emoji = '📗';
  else if (
    assignmentName.includes('Project') ||
    assignmentName.includes('project')
  )
    emoji = '🌀';
  else if (
    assignmentName.includes('Exam') ||
    assignmentName.includes('exam') ||
    assignmentName.includes('Final') ||
    assignmentName.includes('final') ||
    assignmentName.includes('Midterm') ||
    assignmentName.includes('midterm')
  )
    emoji = '🎯';
  else emoji = '✏️';

  return emoji;
};
