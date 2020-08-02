import { Query } from "./globals.js";
import Singleton from "./singleton.js"

let itemHeight = 22;
let itemWidth = 0;

let tooltipWidth = 150;
let tooltipHeight = 25;

function Menu(data) {
  this.parent = null;
  this.data = data;

  this.init = init;
  this.clear = clear;
  this.clickCallback = null;
  this.setParent = setParent;
  this.setClickCallback = setClickCallback;

  // Singleton.addYearSliderCallback(handleClear(this));
}

function setParent(parent) {
  this.parent = parent;

  this.menu = parent.append("g")
    .attr("class", "menu");

  this.menuItemGroup = this.menu.append("g")
    .attr("id", "menuItemGroup");

  this.tooltip = this.menu.append("g")
    .attr("class", "menuTooltip")
    .attr("visibility", "hidden")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight);

  this.tooltip.append("rect")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 4)
    .attr("ry", 4);

  this.tooltip.append("text")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("x", tooltipWidth / 2.0)
    .attr("y", tooltipHeight / 2.0);
}

function setClickCallback(callback) {
  this.clickCallback = callback;
}

function init(cellPassive, courseList, baseTransform) {
  let subject = cellPassive.attr("data-subject");
  let level = +cellPassive.attr("data-level");
  let x = +cellPassive.attr("x");
  let y = +cellPassive.attr("y") + +cellPassive.attr("height") / 2.0;

  let filteredCourses = courseList
    .filter(d => d["Subject"] === subject)
    .filter(d => (d["Number"] >= level))
    .filter(d => d["Number"] <= level + 99);

  filteredCourses.sort((a, b) => {
    if (a["Number"] === b["Number"]) {
      return a["Title"] > b["Title"] ? 1 : -1;
    }
    else {
      return a["Number"] < b["Number"] ? 1 : -1;
    }
  });

  itemWidth = +cellPassive.attr("width");
  tooltipWidth = itemWidth;

  this.menu.attr("transform", "translate(" + x + "," + y + ") " + baseTransform);
  this.clear();

  let menuItems = this.menuItemGroup.selectAll(".menuItem")
    .data(filteredCourses)
    .enter().append("g")
      .attr("class", "menuItem")
      .attr("id", (d) => d["Subject"] + d["Number"])
      .attr("transform", (d, i) => "translate(0," + i * itemHeight + ")")
      .attr("data-subject", (d) => d["Subject"])
      .attr("data-number", (d) => d["Number"])
      .attr("data-title", (d) => d["Title"])
      .on("mouseover", handleMouseOver(this))
      .on("mouseout", handleMouseOut(this))
      .on("click", handleClick(this));

  menuItems.append("rect")
    .attr("class", "menuItemRect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", itemWidth)
    .attr("height", itemHeight);

  menuItems.append("text")
    .attr("class", "menuItemText")
    .attr("x", 0)
    .attr("y", itemHeight / 2.0)
    .text(d => d["Number"] + "-" + d["Title"]);
}

function clear() {
  this.menuItemGroup.selectAll(".menuItem").remove();
}

// https://www.jstips.co/en/javascript/passing-arguments-to-callback-functions/
function handleMouseOver(parent) {
  return function () {
    let menuItem = d3.select(this);
    let menuItemRect = menuItem.select("rect");
    menuItemRect.attr("class", "menuItemRect over");

    let circles = d3.select("g#circles");
    let courseCircle = circles.select("circle#" + menuItem.attr("id"));
    courseCircle.attr("class", "course over");

    let subject = menuItem.attr("data-subject");
    let number = menuItem.attr("data-number");
    let title = menuItem.attr("data-title");

    let filteredData = parent.data;
    filteredData = filteredData
      .filter(d => d["Subject"] === subject)
      .filter(d => d["Number"] === +number)
      .filter(d => d["Course Title"] === title)
      .filter(d => d["Year"] >= Singleton.startYear())
      .filter(d => d["Year"] <= Singleton.endYear());

    const totalStudents = d3.sum(filteredData, d => d["Total"]);
    const transform = "translate(" + 0 + "," + (-tooltipHeight) + ")";

    parent.tooltip
      .attr("visibility", "visible")
      .attr("transform",  transform + menuItem.attr("transform"));

    parent.tooltip.select("text").text("Students: " + totalStudents);
  }
}

function handleMouseOut(parent) {
  return function () {
    let menuItem = d3.select(this);
    let menuItemRect = menuItem.select("rect");
    menuItemRect.attr("class", "menuItemRect");

    let circles = d3.select("g#circles");
    let courseCircle = circles.select("circle#" + menuItem.attr("id"));
    courseCircle.attr("class", "course");

    parent.tooltip
      .attr("visibility", "hidden");
  }
}

function handleClick(parent) {
  return function () {
    let menuItem = d3.select(this);
    let subject = menuItem.attr("data-subject");
    let number = +menuItem.attr("data-number");
    let title = menuItem.attr("data-title");

    let query = new Query(Singleton.startYear(), Singleton.endYear(), subject, number, title);

    parent.clickCallback(query);
  }
}

function handleClear(parent)
{
  return () => parent.clear();
}

export { Menu };
