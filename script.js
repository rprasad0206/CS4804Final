// Visualization 5: Incidents by City (Pie Chart)
function plotIncidentsByCity(year = "All") {
    const filteredData = filterDataByYear(data, year);
    const cityCounts = d3.rollup(
      filteredData,
      (v) => v.length,
      (d) => d["City"]
    );
  
    // Sort the cities by the number of incidents and get the top 10
    const cityData = Array.from(cityCounts)
      .sort((a, b) => b[1] - a[1]) // Sort descending by incident count
      .slice(0, 10) // Get top 10
      .map(([city, count]) => ({
        label: city,
        value: count
      }));
  
    const trace = {
      labels: cityData.map((d) => d.label),
      values: cityData.map((d) => d.value),
      type: "pie",
      textinfo: "label+percent", // Show label and percentage
      marker: {
        colors: cityData.map((d, index) => d3.schemeCategory10[index % 10]), // Color scheme
      }
    };
  
    const layout = {
      title: `Laser Incidents by City (${year === "All" ? "All Years" : year})`,
    };
  
    Plotly.newPlot("chart", [trace], layout);
  }
  