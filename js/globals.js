const grades = [
  "A+", "A", "A-", "B+", "B", "B-",
  "C+", "C", "C-", "D+", "D", "D-", "F", "W"
];

const classLevels = [100, 200, 300, 400, 500];

const gpaDataFile = "data/uiuc-gpa-dataset.txt";
const subjectDataFile = "data/subjects.txt";

function GlobalData() {
  this.grades = grades;
  this.classLevels = classLevels;
  this.gpaDataFile = gpaDataFile;
  this.subjectDataFile = subjectDataFile;
}

function Query(startYear, endYear, subject, number, title) {
  this.startYear = startYear;
  this.endYear = endYear;
  this.subject = subject;
  this.number = number;
  this.title = title;
}

export {
  GlobalData,
  Query
};

const instance = new GlobalData();
Object.freeze(instance);

export default instance;