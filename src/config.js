// config.js
module.exports = {
    USERNAME: "XXXXXXXX",
    PASSWORD: "XXXXXXXX",
    CHARTID: "XXXXXXX",
    CHARTTITLENAME: "XXXXXXXXXX",
    STARTINGINPUT: 4,
    FILENAME:
        "-" +
        "UPLongOnly" +
        "-" +
        (Math.random() + 1).toString(36).substring(7) +
        ".csv",
    strategyInputs: [
        [true, true], //allow longs
        [false, true], //allow shorts
        [false, true], //switch long and shorts
        [0.5, 0.8], //sentiment
        [false, true], //use trailing tp/sl
        [0.7, 0.9], //tp
        [1, 3], //sl
        [false, true], //use VWMA and WMA
        [50, 1000], //tp
        [25, 50], //trailingsl
        [10, 20], //tp
    ],
};
