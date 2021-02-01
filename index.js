const fs = require("fs");
const axios = require("axios");
const { convertArrayToCSV } = require("convert-array-to-csv");

const keywords = fs.readFileSync("keywords.txt").toString().split("\r\n");

const main = async (id, count) => {
  const results = [];

  for (let i = 0; i < count; i++) {
    try {
      const res = await axios.get(
        `https://marketing.yellowpages.com/en/claim-your-listing?ypid=${id}`
      );

      const initial_string = res.data.match(/:biz=".*;}"/g)[0];
      const second_string = initial_string.replace(/:biz=|"|&quot;|{|}/g, "");
      const data_array = second_string.split(",");

      const data_filter = data_array.filter((d) => {
        const key = d.split(":")[0];
        return key === "Name" || key === "HeadingText" || key === "Phone";
      });

      const data = data_filter.reduce((acc, val) => {
        const info = val.split(":");
        const key = info[0].trim();
        const value = info[1].split(",")[0].trim();

        return {
          id,
          ...acc,
          [key]: value,
        };
      }, {});

      results.push(data);

      const filteredData = results.filter((lead) => {
        return !!keywords.find(
          (word) => lead.HeadingText === word && !!lead.Phone
        );
      });

      const filteredCsv = await convertArrayToCSV(filteredData);
      const output = await convertArrayToCSV(results);

      fs.writeFile("./filtered.csv", filteredCsv, () => {});
      fs.writeFile("./output.csv", output, () => {});

      console.log(`${i}: Successfully scraped ${id}`);
    } catch (e) {
      console.log(`${i}: Failed to scrape id ${id}`);
    }

    id++;
  }
};

main(460759729, 10000);
