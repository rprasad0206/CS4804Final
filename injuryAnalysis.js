// injuryAnalysis.js

// Initialize the injury analysis visualization
function initInjuryAnalysis(data) {
    // Log the data structure to inspect it
    console.log(data);
  
    // Convert necessary fields to proper types
    data.forEach(d => {
      d.Count = +d.Count;  // Ensure that 'Count' is a number
      d.Altitude = +d.Altitude;  // Ensure that 'Altitude' is a number
      // 'Laser Color', 'Aircraft', 'State', and 'Injury' will be strings, so no conversion needed for those
    });
  
    // Extract distinct values for filters
    const laserColors = [...new Set(data.map(d => d['Laser Color']))];
    const states = [...new Set(data.map(d => d['State']))];
    const aircrafts = [...new Set(data.map(d => d['Aircraft']))];
  
    // Log the extracted values to ensure they are correct
    console.log('Laser Colors:', laserColors);
    console.log('States:', states);
    console.log('Aircrafts:', aircrafts);
  
    const laserColorFilter = d3.select("#laser-color-filter");
    const stateFilter = d3.select("#state-filter");
    const aircraftFilter = d3.select("#aircraft-filter");
  
    // Populate the laser color filter dropdown
    laserColorFilter.selectAll("option")
      .data(laserColors)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);
  
    // Populate the state filter dropdown
    stateFilter.selectAll("option")
      .data(states)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);
  
    // Populate the aircraft filter dropdown
    aircraftFilter.selectAll("option")
      .data(aircrafts)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);
  
    // Initial render with default values
    updateVisualization(data, laserColors[0], states[0], aircrafts[0]);
  
    // Add event listeners to filters
    laserColorFilter.on("change", function() {
      updateVisualization(data, this.value, stateFilter.property("value"), aircraftFilter.property("value"));
    });
  
    stateFilter.on("change", function() {
      updateVisualization(data, laserColorFilter.property("value"), this.value, aircraftFilter.property("value"));
    });
  
    aircraftFilter.on("change", function() {
      updateVisualization(data, laserColorFilter.property("value"), stateFilter.property("value"), this.value);
    });
  }
  
  // Update the visualization based on selected filters
  function updateVisualization(data, laserColor, state, aircraft) {
    // Filter the data based on the selected filter values
    const filteredData = data.filter(d => 
      (laserColor === "All" || d['Laser Color'] === laserColor) && 
      (state === "All" || d['State'] === state) && 
      (aircraft === "All" || d['Aircraft'] === aircraft)
    );
  
    // Group by injury type (if we have an "Injury" field)
    const injuryCounts = d3.group(filteredData, d => d.Injury);
    const barData = Array.from(injuryCounts, ([key, value]) => ({ Injury: key, Count: value.length }));
  
    // Bar chart visualization
    const barSvg = d3.select("#bar-chart").html("").append("svg")
      .attr("width", 500)
      .attr("height", 300);
  
    const xScale = d3.scaleBand()
      .domain(barData.map(d => d.Injury))
      .range([50, 450])
      .padding(0.1);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.Count)])
      .range([250, 50]);
  
    barSvg.selectAll("rect")
      .data(barData)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.Injury))
      .attr("y", d => yScale(d.Count))
      .attr("width", xScale.bandwidth())
      .attr("height", d => 250 - yScale(d.Count))
      .attr("fill", "steelblue");
  
    // Pie chart visualization
    const pieSvg = d3.select("#pie-chart").html("").append("svg")
      .attr("width", 300)
      .attr("height", 300);
  
    const pie = d3.pie().value(d => d.Count);
    const arc = d3.arc().innerRadius(0).outerRadius(150);
  
    const arcs = pieSvg.selectAll("arc")
      .data(pie(barData))
      .enter()
      .append("g")
      .attr("transform", "translate(150, 150)");
  
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => d3.schemeCategory10[i]);
  }
  