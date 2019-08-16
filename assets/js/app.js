// ---------------------------------------------------------
// SET UP PARAMETERS
// ---------------------------------------------------------

var svgWidth = 900;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// create an SVG wrapper, append an SVG group to hold chart,
// and shift the latter by left and top margins
var svg = d3.select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// set initial x axis
var chosenXAxis = "poverty";

// ---------------------------------------------------------
// CREATE FUNCTIONS TO CALL LATER
// ---------------------------------------------------------

// create function to update x-scale upon click on axis label
function xScale(healthData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenXAxis]) * 0.8,
      d3.max(healthData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// create function to update x axis upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// create function to update & transition circle data points
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// create function to transition circle labels
function renderCircleLables(circleLabels, newXScale, chosenXAxis) {

  circleLabels.transition()
  .duration(1000)
  .attr("x", d => newXScale(d[chosenXAxis]));

return circleLabels;
}

// create function to format incomes with commas at thousand mark
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

// create function to update circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis === "poverty") {
    var label = "Pop in Poverty:";
  }
  else {
    var label = "Avg Income:";
  }

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      if (chosenXAxis === "poverty") {
        return (`<strong>${d.state}</strong><br>${label} ${d[chosenXAxis]}%\
                <br>Pop Without Healthcare: ${d.healthcare}%`);
      }
      else {
        var formattedIncome = formatNumber(d[chosenXAxis]);
        return (`<strong>${d.state}</strong><br>${label} $${formattedIncome}\
                <br>Pop Without Healthcare: ${d.healthcare}%`);
      }
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(d) {
    toolTip.show(d, this);
  })
    // onmouseout event
    .on("mouseout", function(d) {
      toolTip.hide(d);
    });

  return circlesGroup;
}

// ---------------------------------------------------------
// READ IN DATA AND BUILD INITIAL CHART
// ---------------------------------------------------------

// read csv
d3.csv("assets/data/data.csv")
  .then(function(healthData) {

    // parse data and cast as numbers
    healthData.forEach(function(data) {
        data.poverty = +data.poverty;
        data.healthcare = +data.healthcare;
        data.income = +data.income;
    });
   
    // call x scale function
    var xLinearScale = xScale(healthData, chosenXAxis);

    // create y scale function between 4 and healthcare max)
    var yLinearScale = d3.scaleLinear()
      .domain([0, d3.max(healthData, d => d.healthcare)+2])
      .range([height, 0]);    

    // create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);
    
    // append axes to the chart
    var xAxis = chartGroup.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

    chartGroup.append("g")
      .call(leftAxis);

    // append initial circle data points
    var circlesGroup = chartGroup.selectAll("circle")
      .data(healthData)
      .enter()
      .append("circle")
      .attr("cx", d => xLinearScale(d[chosenXAxis]))
      .attr("cy", d => yLinearScale(d.healthcare))
      .attr("r", 15)
      .attr("fill", "LightBlue")
      .attr("stroke", "white");

    // create initial circle labels
    var circleLabels = chartGroup.selectAll(null)
      .data(healthData)
      .enter()
      .append("text")
      .attr("x", d => xLinearScale(d.poverty))
      .attr("y", d => yLinearScale(d.healthcare))
      .text(d => d.abbr)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "10px")
      .attr("fill", "white");

    // create group for 2 x-axis labels
    var labelsGroup = chartGroup.append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var povertyLabel = labelsGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("value", "poverty") 
      .classed("active", true)
      .text("Percent of State Population in Poverty");
    
    var incomeLabel = labelsGroup.append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("value", "income") 
      .classed("inactive", true)
      .text("Average State Income ($)");

    // create y-axis label
    chartGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 40)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .attr("class", "axisText")
      .classed("active", true)
      .text("Percent of State Population Without Healthcare");

    // updateToolTip function above csv import
    var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

// ---------------------------------------------------------
// ADD EVENT LISTENER FOR USER AXIS SELECTIONS
// ---------------------------------------------------------

    // x axis labels event listener
    labelsGroup.selectAll("text")
      .on("click", function() {

        // get value of selection
        var value = d3.select(this).attr("value");
        if (value !== chosenXAxis) {

          // replaces chosenXAxis with value
          chosenXAxis = value;

          // update x scale for new data
          xLinearScale = xScale(healthData, chosenXAxis);
        
          // update x axis with transition
          xAxis = renderAxes(xLinearScale, xAxis);

          // update circles with new x values
          circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

          // update circle labels
          circlesLabels = renderCircleLables(circleLabels, xLinearScale, chosenXAxis);

          // updates tooltips with new info
          circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

          // changes classes to change bold text
          if (chosenXAxis === "income") {
            incomeLabel
              .classed("active", true)
              .classed("inactive", false);
            povertyLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else {
            incomeLabel
              .classed("active", false)
              .classed("inactive", true);
            povertyLabel
              .classed("active", true)
              .classed("inactive", false);
          }
        }
      });
});