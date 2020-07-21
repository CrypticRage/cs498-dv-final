// var d3 = require("d3");

const grades = [
  "A+", "A", "A-", "B+", "B", "B-",
  "C+", "C", "C-", "D+", "D", "D-", "F", "W"
];

const classLevels = [100, 200, 300, 400, 500];

const gpaDataFile = "data/uiuc-gpa-dataset.txt"
const subjectDataFile = "data/subjects.txt"

const terms = {};
const subjects = {};
const courses = {};

let subjectKeys = [];

// set the dimensions and margins of the graph
var maxRadius = 40.0;
var xLabelPad = 5.0;
var xLabelHeight = 30.0;
var yLabelWidth = 60.0;
var yLabelPad = 5.0;

var margin = {
  top: maxRadius + xLabelHeight,
  right: maxRadius,
  bottom: maxRadius,
  left: maxRadius + yLabelWidth
};

var width = 1200 - margin.left - margin.right;
var height = 1500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear()
  .range([0, width])
  .domain([100, 600]);

var y = d3.scaleBand()
  .range([0, height]);

var r = d3.scaleLinear()
  .range([maxRadius / 10.0, maxRadius])

var cellHeight = maxRadius * 2.0;
var cellWidth = x(classLevels[1]);

// grab all the svg elements
const diagram = d3.select("svg")
diagram
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const grid = d3.select("#grid")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const cellsPassive = d3.select("#cellsPassive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const cellsActive = d3.select("#cellsActive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const mainBody = d3.select("#mainBody")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const labels = d3.select("#labels")
  .attr("transform", "translate(" + 0 + "," + 0 + ")");

const debugText = d3.select("#debug");

classLevels.forEach(function(level, index) {
  grid.append("line")
    .attr("x1", x(level))
    .attr("y1", -maxRadius)
    .attr("x2", x(level))
    .attr("y2", height)
    .attr("stroke", "rgb(255, 0, 0)")
    .attr("stroke-width", 2)
});

d3.csv(subjectDataFile).then(function(data) {
  data.forEach(function(d) {
    subjects[d["Subject"]] = d["Title"];
  });

  // set subject scale
  subjectKeys = Object.keys(subjects);
  y.domain(subjectKeys);

  subjectKeys.forEach(function(subject, i) {
    classLevels.forEach(function (level, j) {
      cellsPassive.append("rect")
        .attr("x", x(level))
        .attr("y", y(subject))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", "rgb(0, 0, 255)")
        .attr("opacity", 0.40);

      cellsActive.append("rect")
        .attr("x", x(level))
        .attr("y", y(subject))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("opacity", 0.0)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);
    });
  });

  labels.selectAll(".ylabel")
    .data(data)
    .enter()
    .append("text")
      .text(function(d) { return d["Subject"]; })
      .attr("class", "subject")
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("x", yLabelWidth - yLabelPad)
      .attr("y", function(d) { return y(d["Subject"]) + margin.top; });

  grid.selectAll(".yline")
    .data(data)
    .enter()
    .append("line")
      .attr("x1", -maxRadius)
      .attr("y1", function(d) { return y(d["Subject"]) })
      .attr("x2", width)
      .attr("y2", function(d) { return y(d["Subject"]) })
      .attr("stroke", "rgb(255, 0, 0)")
      .attr("stroke-width", 1)
      .attr("opacity", 0.25);
});

let testString = "";
let testInt = 0;
let maxTotal = 0;

function handleMouseOver(d, i) {
  console.log("over d:" + d + ", i:" + i);
  d.attr({
    fill: "orange",
    stroke: "black"
  });
}

function handleMouseOut(d, i) {
  console.log("out d:" + d + ", i:" + i);
  d.attr({
    fill: "black",
    stroke: "none"
  });
}

d3.csv(gpaDataFile).then(function(data) {
  data.forEach(function(d) {
    if (!(d["YearTerm"] in terms)) {
      terms[d["YearTerm"]] = {"Year": d["Year"], "Term": d["Term"]};
    }

    if (parseInt(d["Year"]) === 2018) {
      const key = d["Subject"].toString() + ":" + d["Number"].toString() + ":" + d["Course Title"].toString();

      let total = 0;
      grades.forEach(function(grade) {
        total += parseInt(d[grade]);
      });

      if (key in courses) {
        courses[key]["Total"] += total;
        total = courses[key]["Total"];
      }
      else {
        courses[key] =
          {"Subject": d["Subject"], "Number": d["Number"], "Title": d["Course Title"], "Total": total};
      }

      if (d["Subject"] in subjects) maxTotal = (total > maxTotal) ? total : maxTotal;
    }
  });

  let courseList = Object.values(courses);

  // set subject scale
  r.domain([0, maxTotal]);

  // append the circles for the chart
  mainBody.selectAll(".circle")
    .data(courseList)
    .enter().append("circle")
    .filter(function(d) { return d["Subject"] in subjects })
    .attr("cx", function(d) { return x(parseInt(d["Number"])); })
    .attr("cy", function(d) { return y(d["Subject"]); })
    .attr("r", function(d) { return r(d["Total"]); })
    .attr("fill-opacity", .25);

  // render debug text
  debugText.selectAll(".debug")
    .data(courseList)
    .enter().append("p")
    .filter(function(d) { return d["Subject"] in subjects })
    .filter(function(d) { return (d["Number"] >= 498) && (d["Number"] <= 498) })
    .text(function(d) {
      let propValue = "";
      let propString = "";
      for(let propName in d) {
        propValue = d[propName]
        propString += propName + " - " + propValue + " "
      }
      propString += " \n"
      return propString;
    })
});

// get the data
/*
d3.csv("data/sales.csv").then(function(data) {

  // format the data
  data.forEach(function(d) {
    d.sales = +d.sales;
  });

  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.salesperson; }));
  y.domain([0, d3.max(data, function(d) { return d.sales; })]);

  // append the rectangles for the bar chart
  diagram.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.salesperson); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.sales); })
    .attr("height", function(d) { return height - y(d.sales); });

  // add the x Axis
  diagram.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  diagram.append("g")
    .call(d3.axisLeft(y));
});
*/
