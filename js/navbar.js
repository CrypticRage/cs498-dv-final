const navGrid = d3.select("div#navGrid");
const yearSliderCallbacks = [];
let startYear = 2014;
let endYear = 2015;

// https://www.digitalocean.com/community/tutorials/js-js-singletons
class NavBar
{
  constructor(){ }

  setYearRange(start, end) {
    startYear = start;
    endYear = end;
  }

  addYearSliderCallback(callback) {
    yearSliderCallbacks.push(callback);
  }

  initNavBar(years) {
    console.log(years);
    let yearRow = navGrid.append("div")
      .attr("class", "centered row");

    let yearSliderCell = yearRow.append("div")
      .attr("class", "eight wide column");

    yearSliderCell.append("div")
      .attr("class", "ui labeled ticked range slider")
      .attr("id", "yearSlider");

    let yearSlider = $("#yearSlider");
    yearSlider.slider({
      min: years[0],
      max: years[years.length - 1],
      start: startYear,
      end: endYear,
      step: 1,
      onChange: this.yearSliderUpdated
    });

    /*
      let termRow = navGrid.append("div")
        .attr("class", "centered row");

      let termCell = termRow.append("div")
        .attr("class", "eight wide column");

      termCell.append("div")
        .attr("class", "ui dropdown");
    */
  }

  yearSliderUpdated(val, start, end) {
    startYear = start;
    endYear = end;

    yearSliderCallbacks.forEach((fn) => {
      fn(val, start, end);
    });
  }
}

const instance = new NavBar();
Object.freeze(instance);

export default instance;