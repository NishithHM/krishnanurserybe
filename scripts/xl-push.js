const exl = require("convert-excel-to-json");
const excelFilePath = "Sample-Add-Plants-DEV-2.xlsx";
const fs = require("fs");

const readXlAndStore = () => {
  const columnToKey = {
    A: "SLNO",
    B: "name",
    C: "fancyName",
    D: "MRP",
    E: "offerPrice",
    F: "imageUrl",
    G: "tips",
    H: "aboutPlantInfo",
    I: "tags",
    J: "sectionName",
    K: "sectionInfo",
    L: "sectionImage",
  };

  const result = exl({
    source: fs.readFileSync(excelFilePath),
    columnToKey,
  });

  return new Promise((resolve, reject) => {
    // console.log(result, "result");
    if (!result["Plant Info"]?.length) reject(new Error("No data found"));
    resolve(result["Plant Info"].slice(1));
  });
};

readXlAndStore().then((data) => {
  //   console.log(data, "data");

  const mergeDuplicates = (data) => {
    const mergedData = [];

    data.forEach((item) => {
      const lastItem = mergedData[mergedData.length - 1];

      if (lastItem && lastItem.SLNO === item.SLNO) {
        Object.keys(item).forEach((key) => {
          if (key !== "SLNO") {
            if (lastItem[key]) {
              if (!Array.isArray(lastItem[key])) {
                lastItem[key] = [lastItem[key]];
              }
              lastItem[key].push(item[key]);
            } else {
              lastItem[key] = item[key];
            }
          }
        });
      } else {
        mergedData.push({ ...item });
      }
    });

    return mergedData;
  };

  console.log(processArray(mergeDuplicates(data)));
});
function processArray(arr) {
  const result = {};
  const arrayProperties = {};

  // First pass: Separate objects with SLNO and collect array properties
  arr.forEach((obj) => {
    if (obj.SLNO) {
      result[obj.SLNO] = { ...obj };
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (!arrayProperties[key]) {
            arrayProperties[key] = [];
          }
          arrayProperties[key].push(...value);
        }
      });
    }
  });

  // Remove duplicates from collected array properties
  Object.keys(arrayProperties).forEach((key) => {
    arrayProperties[key] = [...new Set(arrayProperties[key])];
  });

  // Second pass: Merge array properties into objects with SLNO
  Object.values(result).forEach((obj) => {
    Object.entries(arrayProperties).forEach(([key, value]) => {
      if (obj[key] && !Array.isArray(obj[key])) {
        obj[key] = [obj[key], ...value];
      } else {
        obj[key] = value;
      }
    });

    // Remove duplicates from all array properties in the final object
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        obj[key] = [...new Set(obj[key])];
      }
    });
  });

  return Object.values(result);
}
