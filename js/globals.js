// https://registrar.illinois.edu/courses-grades/explanation-of-grades/

const grades = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F", "W"
];

const gpas = [
  4.0, 4.0, 3.67,
  3.333, 3.0, 2.67,
  2.33, 2.0, 1.67,
  1.33, 1.0, 0.67,
  0.0, 0.0
];

const classLevels = [100, 200, 300, 400, 500];

const gpaDataFile = "data/uiuc-gpa-dataset.txt";
const subjectDataFile = "data/subjects.txt";

function GlobalData() {
  this.grades = grades;
  this.gpas = gpas;
  this.classLevels = classLevels;
  this.courseDataFile = gpaDataFile;
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