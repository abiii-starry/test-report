const reportConfig = {
    fileName: "2.16.0.xlsx",
    sheetName: "2.15.x - Bug",
    version: "2.16.0",
    sheetEndline: 300,
    bugLevel: ["Minor（低）", "Normal（中）", "Major（高）", "优化"],
    validBugStatus: ["已解决", "暂不解决", "未解决", "无法复现"],  // Do not change the order of these types
    invalidBugStatus: ["——"],
    lowQualityNote: "未达交付质量",
    missedBugNote: "漏测",
    sheetHeaderKey: {
        number: "序号",
        currentVersion: "版本",
        bugLevel: "严重程度",
        submitTime: "提交日期",
        bugDesc: "现象",
        developer: "解决人",
        bugStatus: "回归情况",
        bugReason: "造成原因",
        bugSolution: "解决方案",
        regressionCount: "回归次数",
        testNote: "备注"
    },
    previousVersion: "2.15.9"
};

module.exports = reportConfig;