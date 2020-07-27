const grades = [
  "A+", "A", "A-", "B+", "B", "B-",
  "C+", "C", "C-", "D+", "D", "D-", "F", "W"
];

const classLevels = [100, 200, 300, 400, 500];

const gpaDataFile = "data/uiuc-gpa-dataset.txt";
const subjectDataFile = "data/subjects.txt";

function Query(startYear, endYear, subject, number, title) {
  this.startYear = startYear;
  this.endYear = endYear;
  this.subject = subject;
  this.number = number;
  this.title = title;
}

export {
  grades,
  classLevels,
  gpaDataFile,
  subjectDataFile,
  Query
};
