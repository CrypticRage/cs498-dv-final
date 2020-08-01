import Globals from "./globals.js";

// data vars
const years = [];
const subjects = {};
let subjectKeys = [];
let courseData = [];
let rawSubjectData = null;

// constants
const margin = {
  top: 10,
  right: 0,
  bottom: 20,
  left: 20
};

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

  let filteredData = courseData
    .filter(d => d["Subject"] === "CS")
    .filter(d => d["Number"] === 498);

  enrollGraph(filteredData, "Total Course Enrollment (CS 498 Classes)", 1);

  filteredData = courseData
    .filter(d => d["Subject"] === "CS")
    .filter(d => d["Number"] >= 400)
    .filter(d => d["Number"] <= 498);

  enrollGraph(filteredData, "Total Course Enrollment (All CS 400 Level)", 2);
}

function enrollGraph(filteredData, headerText, graphNumber) {
  const width = 500;
  const height = 250;

  let uniqueYears = [...new Set(filteredData.map(d => d.Year))];

  let sums = uniqueYears.map(y => {
    let sample = filteredData.filter(d => d["Year"] === y);
    return d3.sum(sample, d => d["Total"]);
  });

  let averageSum = d3.mean(sums);

  let sumData = uniqueYears.map((y, i) => {
    return { year: y, sum: sums[i] };
  });

  let rangeSum = 0;
  sumData.forEach(d => {
    if (d.year >= 2016) rangeSum += d.sum;
  });
  let rangeAverage = rangeSum / 4.0;

  uniqueYears.sort();

  // draw the graph
  const header = d3.select("div#graph" + graphNumber + "Container")
    .append("h3")
    .attr("class", "graphHeaderText")
    .text(headerText);

  const x = d3.scaleBand()
    .domain(uniqueYears)
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sums) * 1.03])
    .range([height - margin.bottom, margin.top])

  let xAxis = g => g
    .attr("id", "xAxis")
    .attr("transform", `translate(0, ${ height - margin.bottom })`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  let yAxis = g => g
    .attr("id", "yAxis")
    .attr("transform", "translate(0, 0)")
    .call(d3.axisRight(y).ticks(null, "s").tickSize(width))
    .call(g => g.selectAll(".tick:not(:first-of-type) line")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-dasharray", "2, 2"))
    .call(g => g.selectAll(".tick text")
      .attr("x", 0)
      .attr("dy", -4))
    .call(g => g.select(".domain")
      .remove());

  const svg = d3.select("div#graph" + graphNumber + "Container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const averageGroup = svg.append("g");

  averageGroup.append("line")
      .attr("id", "averageLine")
      .attr("x1", 0)
      .attr("y1", y(rangeAverage))
      .attr("x2", width)
      .attr("y2", y(rangeAverage));

  averageGroup.append("text")
      .attr("id", "averageLabel")
      .attr("x", margin.left + 40)
      .attr("y", y(rangeAverage) - 2)
      .text("Average (2016-2019): " + rangeAverage.toFixed(1));

  let axis = svg
    .append("g")
    .attr("id", "axisLabels")

  axis.append("g")
    .call(yAxis);

  axis.append("g")
    .call(xAxis);

  svg.append("g")
    .selectAll("g")
    .data(sumData)
    .join("rect")
    .attr("class", "storyBar")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.sum))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.bottom - y(d.sum))
    .style("fill", d => { if(d.year < 2016) return "grey"; });

  const labelHeight = 20;

  svg.append("g")
    .selectAll("g")
    .data(sumData)
    .join("text")
    .attr("class", "storyLabel")
    .attr("x", d => x(d.year) + x.bandwidth() / 2.0)
    .attr("y", d => y(d.sum))
    .text(d => d.sum);

  const footer = d3.select("div#graph" + graphNumber + "Container")
    .append("p")
    .attr("class", "graphFooterText")
    .text("Graph " + graphNumber);
}
