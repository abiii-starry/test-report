const reportConfig = require("./report-conf.js")
const XLSX = require("xlsx");
const fs = require("fs");
const repJson = require("./bug-info/2.16.0.js");

let bugSheet = XLSX.readFile(`bug-excel/${reportConfig.fileName}`).Sheets[`${reportConfig.sheetName}`];
let totalBugData  = XLSX.utils.sheet_to_json(bugSheet);
const BUG_KEY = reportConfig.sheetHeaderKey;
const BUG_LEVEL = reportConfig.bugLevel;

const totalValidBugInfo =  getTotalValidBugInfo();
const totalValidBugCount = totalValidBugInfo.length; 

// Public function
function getBugsInfoByNum(...num) {
    return totalValidBugInfo.filter((item) => num.includes(item[BUG_KEY.number]));
}

function getColByName(colName) {
    let colElemList = [];
    totalValidBugInfo.forEach((elem) => {
        if(elem[colName]) colElemList.push(elem[colName]);
    });

    return colElemList;
}

function getTotalValidBugInfo() {
    const validBugData = totalBugData;
    const currentVersion = BUG_KEY.currentVersion;
    const submitTime = BUG_KEY.submitTime;

    for (let item of validBugData) {
        // Fill in missing version number information
        if (!item[currentVersion]) {
            item[currentVersion] = validBugData[validBugData.indexOf(item) - 1][currentVersion];
        }
        // Fill in missing submit time information
        if (!item[submitTime]) {
            item[submitTime] = validBugData[validBugData.indexOf(item) - 1][submitTime];
        }

        // Remove emoji for bugs that have been resolved
        if (item[BUG_KEY.bugStatus]) {
            if (item[BUG_KEY.bugStatus].includes(reportConfig.validBugStatus[0])) item[BUG_KEY.bugStatus] = reportConfig.validBugStatus[0];
            if (item[BUG_KEY.bugStatus].includes(reportConfig.validBugStatus[1])) item[BUG_KEY.bugStatus] = reportConfig.validBugStatus[1];
        }
    }
    
    return validBugData.filter((item) => reportConfig.validBugStatus.includes(item[BUG_KEY.bugStatus]) && item[BUG_KEY.currentVersion] == reportConfig.version);
};

function getTestPeriod() {
    const bugSubmitTimeList = Array.from(totalValidBugInfo, (item, index) => item[BUG_KEY.submitTime]);
    return { startTime: bugSubmitTimeList[0], endTime: bugSubmitTimeList[bugSubmitTimeList.length - 1] };
}

// Compare the total number of bugs and regression averages with previous version
function compareBugInfoWithPrevious() {
    if (reportConfig.previousVersion) {
        const previousVersionPath = `./bug-info/${reportConfig.previousVersion}.js`;
        const previousVersionInfo = require(previousVersionPath);
        const bugCountChangeRate = totalValidBugCount / previousVersionInfo.totalBugCount - 1;
        const avgRegressionChangeRate = getAvgRegressionCount() / previousVersionInfo.regressionInfo.avgRegressionCount - 1;

        return { bugCountChangeRate, avgRegressionChangeRate };
    } else {
        console.log("No previous version number configured");

        return null; 
    }
}

// Bug level function
function getBugCountByLevel() {
    function getBugListByLevel(level) {
        return getColByName(BUG_KEY.bugLevel).filter((item) => item == level);
    }

    return Object.fromEntries(BUG_LEVEL.map(item => [item, getBugListByLevel(item).length]));
}

function getBugDataByLevel(level) {
    return totalValidBugInfo.filter((item) => item[BUG_KEY.bugLevel].includes(level));
}

// Regression information function
function getAvgRegressionCount() {
    let totalRegressionCount = getColByName(BUG_KEY.regressionCount).reduce((accumulator, currentElem) => {
        // If the number of regressions is not filled in, it is considered to be the basic number of regressions 2
        if(!Number.isInteger(currentElem)) currentElem = reportConfig.baseRegressionNumber;
        return accumulator + currentElem;
    });

    return (totalRegressionCount / totalValidBugCount).toFixed(2);
}

function getMaxRegressionCount() {
    const regressionCountList = getColByName(BUG_KEY.regressionCount);
    
    for (let i = 1; i <= regressionCountList.length - 1; i++) {
        for (let j = 0; j < regressionCountList.length - i; j++) {
          if (regressionCountList[j] < regressionCountList[j + 1]) {
            let temp = regressionCountList[j];
            regressionCountList[j] = regressionCountList[j + 1];
            regressionCountList[j + 1] = temp;
          }
        }
    }

    return regressionCountList[0];
}

function getMaxRegressionCountBugInfo() {
    return totalValidBugInfo.filter((item) => item[BUG_KEY.regressionCount] == getMaxRegressionCount());
}

// Bugs that do not meet the quality or missed of testing
function getLowQualityAndMissedBugInfo() {
    let totalTestNoteBugInfo =  totalValidBugInfo.filter((item) => {
        if(item[BUG_KEY.testNote]) return item[BUG_KEY.testNote].includes(reportConfig.lowQualityNote) || item[BUG_KEY.testNote].includes(reportConfig.missedBugNote);
    }); 

    return {
        lowQualityBug: totalTestNoteBugInfo.filter((item) => item[BUG_KEY.testNote].includes(reportConfig.lowQualityNote)),
        missedTestBug: totalTestNoteBugInfo.filter((item) => item[BUG_KEY.testNote].includes(reportConfig.missedBugNote))
    }
}

// Version risk: Unresolved bugs and bugs that cannot be reproduced consistently
function getUnresolvedBug() {
    return totalValidBugInfo.filter((item) => item[BUG_KEY.bugStatus] == reportConfig.validBugStatus[2]);
}

function getUnreproducibleBug() {
    return totalValidBugInfo.filter((item) => item[BUG_KEY.bugStatus] == reportConfig.validBugStatus[3]);
}

// Return result
function generateBugReportData() {
    let report = {
        testPeriod: getTestPeriod(),
        compareWithPreviousVersion: compareBugInfoWithPrevious(),
        totalBugCount: null,
        bugLevel: null,
        regressionInfo: null,
        testNoteInfo: generateTestNoteInfo(),
        versionRisk: {
            unresolvedBug: getUnresolvedBug(),
            unreproducibleBug: getUnreproducibleBug()
        }
    };

    function generateBugLevelInfo(needNormal=false) {
        let bugLevel = {
            bugCount: getBugCountByLevel(),
            majorBugList: getBugDataByLevel(BUG_LEVEL[2])
        }
        if(needNormal) bugLevel["normalBugList"] = getBugDataByLevel(BUG_LEVEL[1]);

        return bugLevel;
    }

    function generatorRegressionInfo() {
        let regressionInfo = {
            avgRegressionCount: getAvgRegressionCount(),
            maxRegressionCount: getMaxRegressionCount(),
            maxRegressionCountBugInfo: getMaxRegressionCountBugInfo()
        }

        return regressionInfo;
    }

    function generateTestNoteInfo() {
        const testNoteInfo = getLowQualityAndMissedBugInfo();
        return {
            lowQualityBug: testNoteInfo.lowQualityBug,
            missedBug: testNoteInfo.missedTestBug
        }
    }

    report["totalBugCount"] = totalValidBugCount;
    report["regressionInfo"] = generatorRegressionInfo();
    report["bugLevel"] = generateBugLevelInfo();
    let reportJson = JSON.stringify(report, null, "\t");

    fs.writeFile(`./bug-info/${reportConfig.version}.js`, `let repJson = ${reportJson};\nmodule.exports = repJson;`, err => {
        err ? console.log("File written Failed!") : console.log("File written successfully");
    })
}

generateBugReportData();
