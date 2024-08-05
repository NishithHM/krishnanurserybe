const exl = require("convert-excel-to-json");
const excelFilePath = "Sample-Add-Plants-DEV-2.xlsx";
const fs = require("fs");

const readXlAndStore = () => {
  const columnToKey = {
    A: "SLNO",
    B: "name",
    C: "nameForCustomer",
    D: "sellingPrice",
    E: "discountedSellingPrice",
    F: "coverImages",
    G: "tips",
    H: "moreInfo",
    I: "tags",
    // J: "sectionName",
    // K: "sectionInfo",
    L: "sections",
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

  let convertedData = processArray(mergeDuplicates(data));

  
});
// function processArray(arr) {
//   const result = {};
//   const arrayProperties = {};

//   // First pass: Separate objects with SLNO and collect array properties
//   arr.forEach((obj) => {
//     if (obj.SLNO) {
//       result[obj.SLNO] = { ...obj };
//       // Transform sectionImage into an array of objects
//       if (obj.sectionImage && obj.sectionName) {
//         result[obj.SLNO].sectionImage = [
//           {
//             name: obj.sectionName,
//             data: obj.sectionImage,
//           },
//         ];
//       }
//     } else {
//       Object.entries(obj).forEach(([key, value]) => {
//         if (Array.isArray(value)) {
//           if (!arrayProperties[key]) {
//             arrayProperties[key] = [];
//           }
//           arrayProperties[key].push(...value);
//         } else if (key === "sectionImage" && obj.sectionName) {
//           if (!arrayProperties[key]) {
//             arrayProperties[key] = [];
//           }
//           arrayProperties[key].push({
//             name: "section",
//             data: value,
//           });
//         }
//       });
//     }
//   });

//   // Remove duplicates from collected array properties
//   Object.keys(arrayProperties).forEach((key) => {
//     if (key === "sectionImage") {
//       // For sectionImage, remove duplicates based on name
//       arrayProperties[key] = arrayProperties[key].filter(
//         (obj, index, self) =>
//           index === self.findIndex((t) => t.name === obj.name)
//       );
//     } else {
//       arrayProperties[key] = [...new Set(arrayProperties[key])];
//     }
//   });

//   // Second pass: Merge array properties into objects with SLNO
//   Object.values(result).forEach((obj) => {
//     Object.entries(arrayProperties).forEach(([key, value]) => {
//       if (key === "sectionImage") {
//         if (!obj[key]) {
//           obj[key] = value;
//         } else {
//           obj[key] = [...obj[key], ...value];
//         }
//       } else if (obj[key] && !Array.isArray(obj[key])) {
//         obj[key] = [obj[key], ...value];
//       } else {
//         obj[key] = value;
//       }
//     });

//     // Remove duplicates from all array properties in the final object
//     Object.keys(obj).forEach((key) => {
//       if (Array.isArray(obj[key])) {
//         if (key === "sectionImage") {
//           // For sectionImage, remove duplicates based on name
//           obj[key] = obj[key].filter(
//             (item, index, self) =>
//               index === self.findIndex((t) => t.name === item.name)
//           );
//         } else {
//           obj[key] = [...new Set(obj[key])];
//         }
//       }
//     });
//   });

//   return Object.values(result);
// }

function processArray(arr) {
  const result = {};
  const arrayProperties = {};

  function processSections(sections) {
    if (typeof sections === "string") {
      return [{ data: sections, name: "section1.png" }];
    } else if (Array.isArray(sections)) {
      return sections.map((section, index) => ({
        data: section,
        name: `section${index + 1}.png`,
      }));
    }
    return [];
  }

  // First pass: Separate objects with SLNO and collect array properties
  arr.forEach((obj) => {
    if (obj.SLNO) {
      result[obj.SLNO] = { ...obj };
      result[obj.SLNO].sections = processSections(obj.sections);
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value) || key === "sections") {
          if (!arrayProperties[key]) {
            arrayProperties[key] = [];
          }
          if (key === "sections") {
            arrayProperties[key].push(...processSections(value));
          } else {
            arrayProperties[key].push(...value);
          }
        }
      });
    }
  });

  // Remove duplicates from collected array properties
  Object.keys(arrayProperties).forEach((key) => {
    if (key === "sections") {
      // For sections, remove duplicates based on data
      arrayProperties[key] = arrayProperties[key].filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.data === obj.data)
      );
    } else {
      arrayProperties[key] = [...new Set(arrayProperties[key])];
    }
  });

  // Second pass: Merge array properties into objects with SLNO
  Object.values(result).forEach((obj) => {
    Object.entries(arrayProperties).forEach(([key, value]) => {
      if (key === "sections") {
        obj[key] = [...(obj[key] || []), ...value];
      } else if (Array.isArray(obj[key])) {
        obj[key] = [...obj[key], ...value];
      } else if (obj[key]) {
        obj[key] = [obj[key], ...value];
      } else {
        obj[key] = value;
      }
    });

    // Remove duplicates from all array properties in the final object
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        if (key === "sections") {
          // For sections, remove duplicates based on data
          obj[key] = obj[key].filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.data === item.data)
          );
        } else {
          obj[key] = [...new Set(obj[key])];
        }
      }
    });

    // Ensure sections is always an array with the correct structure
    if (!obj.sections) {
      obj.sections = [];
    }
  });

  return Object.values(result);
}
