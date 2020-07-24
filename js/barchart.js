import { grades } from "./globals.js";

const barChart = d3.select("svg")
  .append("g")
    .attr("class", "barChart");
    // .attr("transform", "translate(50%, 50%)");

let margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

let width = 1000 - margin.left - margin.right;
let height = 700 - margin.top - margin.bottom;

let data = null;

// set the ranges
let x = d3.scaleBand()
  .range([0, width]);

let y = d3.scaleLinear()
  .range([height, 0]);

function initChart(d) {
  data = d;
}

function showChart(query) {
  console.log(data);

  let queryData = data
    .filter(d => d["Year"] >= query.startYear)
    .filter(d => d["Year"] <= query.endYear)
    .filter(d => d["Subject"] === query.subject)
    .filter(d => d["Number"] === +query.number)
    .filter(d => d["Course Title"] === query.title);

  console.log(query);
  console.log(queryData);
  let testData = queryData[0];

  // https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
  const filteredData = Object
    .values(Object
      .keys(testData)
      .filter(key => grades.includes(key))
      .reduce((obj, key) => {
        obj[key] = testData[key];
        return obj;
      }, {})
  );

  console.log(filteredData);

  barChart.append("rect")
    .attr("class", "barChartBackground")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", width)
    .attr("height", height)


  // scale the range of the data in the domains
  x.domain(grades);
  y.domain([0, Math.max.apply(null, filteredData)]);

  console.log(Math.max.apply(null, filteredData));

  // append the rectangles for the bar chart
  barChart.selectAll(".bar")
    .data(testData)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) { return grades[i]; })
      .attr("width", x.bandwidth())
      .attr("y", function(d, i) { return d[grades[i]]; })
      .attr("height", function(d) { return height - y(d); });

  // add the x Axis
  barChart.append("g")
    .attr("transform", "translate(0, " + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  barChart.append("g")
    .attr("transform", "translate(" + margin.left + ", 0)")
    .call(d3.axisLeft(y));
}

function clearChart() {

}

export { initChart, clearChart, showChart };
