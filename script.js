function plotIncidentsByCity(year = "All") {
    // Fetch the data from the JSON file
    fetch("top_cities_by_year.json")
      .then((response) => response.json())
      .then((data) => {
        // Get the data for the selected year
        const yearData = year === "All" ? Object.values(data).flat() : data[year];
  
        // Sort the cities by count in descending order and take the top 10
        const topCities = yearData
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
  
        // Prepare data for the pie chart
        const labels = topCities.map((d) => d.city);
        const values = topCities.map((d) => d.count);
  
        // Create the pie chart trace
        const trace = {
          labels: labels,
          values: values,
          type: "pie",
          textinfo: "label+percent", // Show label and percentage
          marker: {
            colors: labels.map((_, index) => d3.schemeCategory10[index % 10]), // Color scheme
          },
        };
  
        // Define the layout
        const layout = {
          title: `Top 10 Cities by Laser Incidents (${year === "All" ? "All Years" : year})`,
        };
  
        // Plot the chart
        Plotly.newPlot("chart", [trace], layout);
      })
      .catch((error) => {
        console.error("Error loading or processing data:", error);
      });
  }