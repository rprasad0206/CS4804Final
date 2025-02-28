function initInjuryMap(data) {
  const width = window.innerWidth;
  const height = window.innerHeight - 400;  // Adjust the height to avoid cutting off the map
  const svg = d3.select("#injury-analysis-map")
                .attr("width", width)
                .attr("height", height);

  const g = svg.append("g");
  const tooltip = d3.select("#tooltip");
  const infoContainer = d3.select("#state-info-container");  // Info container to show more details

  const projection = d3.geoAlbersUsa()
                       .translate([width / 2, height / 2])
                       .scale(1000);

  const path = d3.geoPath().projection(projection);

  const laserColorFilter = d3.select("#laser-color-filter");
  const aircraftFilter = d3.select("#aircraft-filter");
  const stateFilter = d3.select("#state-filter");

  const laserColors = [...new Set(data.map(d => d["Laser Color"]))].filter(Boolean);
  const aircraftTypes = [...new Set(data.map(d => d["Aircraft"]))].filter(Boolean);
  const states = [...new Set(data.map(d => d["State"]))].filter(Boolean);

  // Populate dropdowns
  laserColorFilter.selectAll("option").data(["All", ...laserColors]).enter().append("option").text(d => d);
  aircraftFilter.selectAll("option").data(["All", ...aircraftTypes]).enter().append("option").text(d => d);
  stateFilter.selectAll("option").data(["All", ...states]).enter().append("option").text(d => d);

  // Convert Incident Date from serial date to JavaScript Date object
  function convertExcelDate(serial) {
      const epoch = new Date(1899, 11, 30); // Excel's epoch
      return new Date((serial - 25569) * 86400 * 1000);
  }

  // Filter data based on selections
  function filterData() {
      const selectedColor = laserColorFilter.node().value;
      const selectedAircraft = aircraftFilter.node().value;
      const selectedState = stateFilter.node().value;

      return data.filter(d => {
          return (
              (selectedColor === "All" || d["Laser Color"] === selectedColor) &&
              (selectedAircraft === "All" || d["Aircraft"] === selectedAircraft) &&
              (selectedState === "All" || d["State"] === selectedState)
          );
      });
  }

  // Update map based on filtered data
  function updateMap() {
      const filteredData = filterData();
      const selectedColor = laserColorFilter.node().value;
      const stateInjuryCounts = {};

      filteredData.forEach(d => {
          if (d.Injury && d.Injury.toLowerCase() !== "none") {
              stateInjuryCounts[d.State] = (stateInjuryCounts[d.State] || 0) + 1;
          }
      });

      // Load GeoJSON for US states map
      d3.json("ne_110m_admin_1_states_provinces.json").then(geoData => {
          g.selectAll("path").remove();

          g.selectAll("path")
           .data(geoData.features)
           .enter()
           .append("path")
           .attr("d", path)
           .attr("fill", d => {
               const injuryCount = stateInjuryCounts[d.properties.name] || 0;
               return injuryCount > 0 ? selectedColor : "#cccccc"; // Use selected color for injuries, gray for no injuries
           })
           .attr("stroke", "#333")
           .on("mouseover", (event, d) => {
               const injuryCount = stateInjuryCounts[d.properties.name] || 0;
               tooltip.style("display", "block")
                      .html(`${d.properties.name}`)
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY + 10) + "px");
           })
           .on("mouseout", () => tooltip.style("display", "none"))
           .on("click", (event, d) => showStateInfo(d.properties.name));
      });
  }

  // Display detailed information when a state is clicked
  function showStateInfo(stateName) {
      const stateData = data.filter(d => d.State === stateName);
      const injuryCount = stateData.filter(d => d.Injury && d.Injury.toLowerCase() !== "none").length;

      // Populate state-specific info into the container
      infoContainer.html(`
          <h3>State: ${stateName}</h3>
          <p>Number of injuries: ${injuryCount}</p>
          <table>
              <thead>
                  <tr><th>Laser Color</th><th>Aircraft</th><th>Altitude</th><th>City</th><th>Injury</th><th>Flight ID</th></tr>
              </thead>
              <tbody>
                  ${stateData.map(d => `
                      <tr>
                          <td>${d["Laser Color"]}</td>
                          <td>${d["Aircraft"]}</td>
                          <td>${d["Altitude"]}</td>
                          <td>${d["City"]}</td>
                          <td>${d["Injury"]}</td>
                          <td>${d["Flight ID"]}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      `);
      infoContainer.style("display", "block");
  }

  // Event listeners for filters
  laserColorFilter.on("change", updateMap);
  aircraftFilter.on("change", updateMap);
  stateFilter.on("change", updateMap);

  updateMap();

  // Zoom and Pan functionality
  const zoom = d3.zoom()
                 .scaleExtent([1, 8]) // Set zoom in/out limits
                 .on("zoom", (event) => {
                     g.attr("transform", event.transform);
                 });

  svg.call(zoom);
}
