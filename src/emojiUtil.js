const getEmoji = (assignmentName) => {
    var emoji;

    if (assignmentName.includes("Exam")) {
        emoji = "🅾️";
    } else if (assignmentName.includes("Project")) {
        emoji = "🌀";
    } else {
        emoji = "✏️";
    }
    return emoji;
}

export {getEmoji};
