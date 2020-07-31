// https://www.digitalocean.com/community/tutorials/js-js-singletons
// https://www.sitepoint.com/javascript-design-patterns-singleton/

const yearSliderCallbacks = [];
let clearCallback = null;
let showCallback = null;

let _startYear = 2013;
let _endYear = 2016;

const navGrid = d3.select("div#navGrid");
let backButton = null;

class Singleton {
  constructor() {
    if (!Singleton.instance) {
      Singleton.instance = this;
    }
    return Singleton.instance;
  }

  startYear() { return _startYear; }

  endYear() { return _endYear; }

  setClearCallback(clear) {
    clearCallback = clear;
  }

  setShowCallback(show) {
    showCallback = show;
  }

  addYearSliderCallback(callback) {
    yearSliderCallbacks.push(callback);
  }

  setYears(years) {
    console.log(years);
    let yearSlider = $("#yearSlider");
    yearSlider.slider({
      min: years[0],
      max: years[years.length - 1],
      start: _startYear,
      end: _endYear,
      step: 1,
      onChange: yearSliderUpdated
    });
  }

  initNavBar() {
    let row = navGrid.append("div")
      .attr("class", "centered row");

    let leftCell = row.append("div")
      .attr("class", "left aligned three wide column");

    let yearSliderCell = row.append("div")
      .attr("class", "center aligned eight wide column");
    yearSliderCell.append("div")
      .attr("class", "ui labeled ticked range slider")
      .attr("id", "yearSlider");

    let rightCell = row.append("div")
      .attr("class", "right aligned three wide column");

    backButton = rightCell.append("div")
      .attr("id", "backButton")
      .attr("class", "ui icon button hidden");

    backButton.append("i")
      .attr("class", "arrow left icon");

    backButton = $("#backButton");
    backButton.on("click", back);
  }

  showBackButton() {
    backButton.attr("class", "ui icon button");
  }

  hideBackButton() {
    backButton.attr("class", "ui icon button hidden");
  }
}

function back() {
  if (clearCallback) clearCallback();
  if (showCallback) showCallback();
}

function yearSliderUpdated(val, start, end) {
  _startYear = start;
  _endYear = end;

  yearSliderCallbacks.forEach((f) => f());
}

const instance = new Singleton();
Object.freeze(instance);

export default instance
