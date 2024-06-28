const fontSize = 16;
const margin = {
  left: 9 * fontSize,
  right: 9 * fontSize,
  top: 1 * fontSize,
  bottom: 8 * fontSize,
};
const width = 600 + margin.left + margin.right;
const height = 350 + margin.top + margin.bottom;

let countyData, eduData;

const eduURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const countyURL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

d3.json(countyURL)
  .then((data) => {
    countyData = topojson.feature(data, data.objects.counties).features;
    console.log("County Data:", countyData);

    d3.json(eduURL)
      .then((data) => {
        eduData = data;
        console.log("Education Data:", eduData);

        const svg = d3
          .select("#map")
          .append("svg")
          .attr("id", "chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);

        const g = svg.append("g");

        const path = d3.geoPath();

        const counties = g
          .selectAll("path")
          .data(countyData)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "county")
          .attr("fill", (d) => {
            let id = d["id"];
            let county = eduData.find((item) => item["fips"] === id);
            if (!county) {
              console.warn("No education data found for county ID:", id);
              return "#ccc"; // default color for missing data
            }
            let percentage = county["bachelorsOrHigher"];
            const colors = [
              "#08306b",
              "#08519c",
              "#2171b5",
              "#4292c6",
              "#6baed6",
              "#9ecae1",
              "#c6dbef",
              "#deebf7",
              "#f7fbff",
            ];
            if (percentage >= 66) return colors[0];
            if (percentage >= 57) return colors[1];
            if (percentage >= 48) return colors[2];
            if (percentage >= 39) return colors[3];
            if (percentage >= 30) return colors[4];
            if (percentage >= 21) return colors[5];
            if (percentage >= 12) return colors[6];
            if (percentage >= 6) return colors[7];
            return colors[8];
          })
          .attr("data-fips", (countyDataItem) => countyDataItem["id"])
          .attr("data-education", (countyDataItem) => {
            let id = countyDataItem["id"];
            let county = eduData.find((item) => item["fips"] === id);
            if (!county) {
              console.warn("No education data found for county ID:", id);
              return 0; // default percentage for missing data
            }
            return county["bachelorsOrHigher"];
          })
          .on("mouseover", (event, countyDataItem) => {
            console.log("Mouseover event triggered"); // Debugging line
            let id = countyDataItem["id"];
            let county = eduData.find((item) => item["fips"] === id);
            if (!county) {
              console.warn("No education data found for county ID:", id);
              return;
            }
            const tooltip = d3.select("#tooltip");
            tooltip
              .style("opacity", 0.9)
              .html(
                `${county["fips"]} - ${county["area_name"]}, ${county["state"]}: ${county["bachelorsOrHigher"]}%`
              )
              .attr("data-education", county["bachelorsOrHigher"])
              .style("left", event.pageX + 5 + "px")
              .style("top", event.pageY - 40 + "px");
          })
          .on("mouseout", () => {
            d3.select("#tooltip").style("opacity", 0);
          })
          .on("click", (event, countyDataItem) => {
            let id = countyDataItem["id"];
            let county = eduData.find((item) => item["fips"] === id);
            if (!county) {
              console.warn("No education data found for county ID:", id);
              return;
            }
            const details = d3.select("#details");
            details
              .style("display", "block")
              .style("left", event.pageX + 5 + "px")
              .style("top", event.pageY + 5 + "px");

            // Fetch additional data from Wikipedia
            fetchWikipediaData(county["area_name"], county["state"])
              .then((wikiContent) => {
                d3.select("#details-content")
                  .html(`<strong>${county["area_name"]}, ${county["state"]}</strong><br>
                         FIPS: ${county["fips"]}<br>
                         Bachelors or Higher: ${county["bachelorsOrHigher"]}%<br><br>
                         <strong>More Information:</strong><br><a target="_blank" href="${wikiContent}">${county["area_name"]}</a>`);
              })
              .catch((error) => {
                console.error("Error fetching Wikipedia data:", error);
                d3.select("#details-content")
                  .html(`<strong>${county["area_name"]}, ${county["state"]}</strong><br>
                         FIPS: ${county["fips"]}<br>
                         Bachelors or Higher: ${county["bachelorsOrHigher"]}%<br><br>
                         <strong>More Information:</strong><br>Failed to fetch additional information.`);
              });
          });

        d3.select("#close-details").on("click", () => {
          d3.select("#details").style("display", "none");
        });

        const zoom = d3
          .zoom()
          .scaleExtent([1, 8])
          .on("zoom", (event) => {
            g.attr("transform", event.transform);
          });

        svg.call(zoom);

        d3.select("#zoom-in").on("click", () => {
          zoom.scaleBy(svg.transition().duration(750), 1.3);
        });

        d3.select("#zoom-out").on("click", () => {
          zoom.scaleBy(svg.transition().duration(750), 0.7);
        });

        d3.select("#reset").on("click", () => {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        });

        d3.select("#search").on("input", function () {
          const query = this.value.toLowerCase();
          const result = eduData.find(
            (county) =>
              county.area_name.toLowerCase().includes(query) ||
              county.state.toLowerCase().includes(query)
          );
          if (result) {
            const county = countyData.find((d) => d.id === result.fips);
            g.selectAll("path")
              .attr("fill", (d) => {
                let id = d["id"];
                let county = eduData.find((item) => item["fips"] === id);
                if (!county) {
                  console.warn("No education data found for county ID:", id);
                  return "#ccc"; // default color for missing data
                }
                let percentage = county["bachelorsOrHigher"];
                const colors = [
                  "#08306b",
                  "#08519c",
                  "#2171b5",
                  "#4292c6",
                  "#6baed6",
                  "#9ecae1",
                  "#c6dbef",
                  "#deebf7",
                  "#f7fbff",
                ];
                if (percentage >= 66) return colors[0];
                if (percentage >= 57) return colors[1];
                if (percentage >= 48) return colors[2];
                if (percentage >= 39) return colors[3];
                if (percentage >= 30) return colors[4];
                if (percentage >= 21) return colors[5];
                if (percentage >= 12) return colors[6];
                if (percentage >= 6) return colors[7];
                return colors[8];
              })
              .filter((d) => d.id === result.fips)
              .attr("fill", "#ff0000"); // highlight searched county
          }
        });

        const legendData = [
          { color: "#08306b", percentage: "66% - 100%", range: [66, 100] },
          { color: "#08519c", percentage: "57% - 66%", range: [57, 66] },
          { color: "#2171b5", percentage: "48% - 57%", range: [48, 57] },
          { color: "#4292c6", percentage: "39% - 48%", range: [39, 48] },
          { color: "#6baed6", percentage: "30% - 39%", range: [30, 39] },
          { color: "#9ecae1", percentage: "21% - 30%", range: [21, 30] },
          { color: "#c6dbef", percentage: "12% - 21%", range: [12, 21] },
          { color: "#deebf7", percentage: "6% - 12%", range: [6, 12] },
          { color: "#f7fbff", percentage: "0% - 6%", range: [0, 6] },
        ];

        // Ensure each legendData entry has a range property
        legendData.forEach((d, i) => {
          console.log(`Legend Data [${i}]:`, d);
        });

        const legend = d3
          .select("#legend")
          .append("svg")
          .attr("width", 150)
          .attr("height", 300);

        const rectHeight = 20;
        const rectWidth = 20;
        const rectPadding = 5;

        legend
          .selectAll("rect")
          .data(legendData)
          .enter()
          .append("rect")
          .attr("x", 10)
          .attr("y", (d, i) => 10 + i * (rectHeight + rectPadding))
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .attr("fill", (d) => d.color)
          .on("click", (event, d) => {
            if (!d.range) {
              console.error("Error: d.range is undefined", d);
              return;
            }
            g.selectAll("path").attr("fill", (countyDataItem) => {
              let id = countyDataItem["id"];
              let county = eduData.find((item) => item["fips"] === id);
              if (!county) {
                console.warn("No education data found for county ID:", id);
                return "#ccc"; // default color for missing data
              }
              let percentage = county["bachelorsOrHigher"];
              return percentage >= d.range[0] && percentage < d.range[1]
                ? d.color
                : "#ccc";
            });
          });

        legend
          .selectAll("text")
          .data(legendData)
          .enter()
          .append("text")
          .attr("x", 40)
          .attr("y", (d, i) => 25 + i * (rectHeight + rectPadding))
          .text((d) => d.percentage)
          .attr("alignment-baseline", "middle");
      })
      .catch((error) => {
        console.error("Error fetching education data:", error);
      });
  })
  .catch((error) => {
    console.error("Error fetching county data:", error);
  });

// Function to fetch data from Wikipedia
function fetchWikipediaData(areaName, state) {
  const query = `${areaName}, ${state}`;
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(
    query
  )}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const pages = data.query.pages;
      const page = Object.values(pages)[0];
      const link = `https://en.wikipedia.org/wiki/${page.title}`;

      return (
        link || "No additional information available."
      );
    })
    .catch((error) => {
      console.error("Error fetching Wikipedia data:", error);
      return "Failed to fetch additional information.";
    });
}
