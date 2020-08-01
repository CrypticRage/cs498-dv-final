import Globals from "./globals.js";

// data vars
const years = [];
let rawSubjectData = null;
const subjects = {};
let subjectKeys = [];

let courseData = [];

d3.csv(Globals.subjectDataFile).then(initSubjectData);

function initSubjectData(data) {
  rawSubjectData = data;
  data.forEach(d => {
    subjects[d["Subject"]] = d["Title"];
  });
  subjectKeys = Object.keys(subjects);

  d3.csv(Globals.courseDataFile).then(initCourseData);
}

function initCourseData(data) {
  let i = 0;
  data.forEach(d => {
    d["ID"] = i;
    d["Number"] = +d["Number"];
    d["Year"] = +d["Year"];

    if (!years.includes(d["Year"])) years.push(d["Year"]);

    Globals.grades.forEach(g => {
      d[g] = +d[g];
    });

    d["Total"] = d3.sum(Globals.grades, g => d[g]);

    courseData.push(data[i++]);
  });

  years.sort();
  bar1();
}

function bar1() {
  const width = 800;
  const height = 400;

  let filteredData = courseData
    .filter(d => d["Subject"] === "CS")
    .filter(d => d["Number"] === 498);

  let uniqueYears = [...new Set(filteredData.map(d => d.Year))];

  let sums = uniqueYears.map(y => {
    let sample = filteredData.filter(d => d["Year"] === y);
    return d3.sum(sample, d => d["Total"]);
  });

  let averageSum = d3.mean(sums);

  let sumData = uniqueYears.map((y, i) => {
    return { year: y, sum: sums[i] };
  });

  uniqueYears.sort();

  const x = d3.scaleBand()
    .domain(uniqueYears)
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sums)])
    .range([height, 0]);

  const svg = d3.select("svg#bar1")
    .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
    .append("line")
    .attr("id", "averageLine")
    .attr("x1", 0)
    .attr("y1", height - y(averageSum))
    .attr("x2", width)
    .attr("y2", height - y(averageSum))
    .style("color", "red");

  svg.append("g")
    .selectAll("g")
    .data(sumData)
    .join("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.sum))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.sum));
}
