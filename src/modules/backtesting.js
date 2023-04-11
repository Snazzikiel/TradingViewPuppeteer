const {
    FILENAME,
    CHARTTITLENAME,
    STARTINGINPUT,
    strategyInputs,
} = require("../config");
const {
    getMinMaxValues,
    setInputValue,
    checkIfSelectorExists,
} = require("./utils");
const fs = require("fs");
const path = require("path");

let tradePair = "BTCUSDT";
let tradeInterval = "4H";

// backtesting.js
const moduleExports = {
    createNewFile: async function (page) {
        tradePair = await page.$eval(
            "#header-toolbar-symbol-search .js-button-text",
            (element) => element.innerText
        );
        tradeInterval = await page.$eval(
            "#header-toolbar-intervals",
            (element) => element.innerText
        );
        const fname =
            CHARTTITLENAME +
            "-" +
            tradePair +
            "-" +
            tradeInterval +
            "-" +
            FILENAME;
        let headerInfo = "TradePair,TimeFrame";

        let i = 1;
        strategyInputs.forEach((ele) => {
            headerInfo += ",Input" + i++;
        });

        headerInfo += ",NetProfit $";
        headerInfo += ",NetProfit %";
        headerInfo += ",Total Closed Trades";
        headerInfo += ",Percent Profitable";
        headerInfo += ",Profit Factor";
        headerInfo += ",Max Drawdown $";
        headerInfo += ",Max Drawdown %";
        headerInfo += ",Average Trade $";
        headerInfo += ",Average Trade %";
        headerInfo += ",Average # Bars in Trade";
        headerInfo += "\n";
        console.log("Filename: ", fname);

        // Create the subdirectory if it doesn't exist
        const resultsDir = path.join(__dirname, "..", "..", "results");
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }

        // Construct the file path, including the subdirectory
        const outputPath = path.join(resultsDir, fname);

        fs.writeFile(outputPath, headerInfo, function (err) {
            if (err) throw err;
        });
    },
    setAlgoSettingInputs: async function (
        index,
        inputsToEnter,
        inputElements,
        page
    ) {
        await page.waitForSelector(".backtesting .deep-history");

        if (index >= strategyInputs.length) {
            await moduleExports.inputNewSettingsToPage(
                inputsToEnter,
                inputElements,
                page
            );
            return;
        }
        const { minValue, maxValue, isDecimalFlag } = getMinMaxValues(
            strategyInputs[index]
        );

        //TODO Cater for Boolean inputs- always go from False to True for now
        for (let i = minValue; i <= maxValue; i++) {
            let num = isDecimalFlag ? i / 10 : i;
            await moduleExports.setAlgoSettingInputs(
                index + 1,
                inputsToEnter + "," + num,
                inputElements,
                page
            );
        }
    },
    inputNewSettingsToPage: async function (allSettings, inputs, page) {
        let settingSplit = allSettings.substring(1).split(",");
        if (inputs.length - STARTINGINPUT >= settingSplit.length) {
            //if (settingSplit.length === inputs.length - STARTINGINPUT) {
            for (let i = 0; i < settingSplit.length; i++) {
                await setInputValue(
                    inputs[i + STARTINGINPUT],
                    settingSplit[i],
                    page
                );
                await page.waitForTimeout(1);
            }
        }
        await page.keyboard.press("Enter");
        await moduleExports.createStringAndSaveData(page, settingSplit);
    },
    //TODO - Ovewriting header line
    createStringAndSaveData: async function (page, settings) {
        // Wait for 1 second to make sure the data is loaded
        await page.waitForTimeout(1500);

        // // Wait for the ".backtesting-content-wrapper" element to be available on the page
        await page.waitForSelector(`.backtesting-content-wrapper`);

        //if there is no results, return blank
        const isBlank = await checkIfSelectorExists(
            `.backtesting-content-wrapper [class*="emptyStateIcon-"]`
        );
        if (isBlank) {
            return;
        }

        const results = await page.$$(
            `.backtesting-content-wrapper [class*="secondRow-"]`
        );

        //don't record negative net profits
        if (
            results.length === 0 ||
            (!!results[0].innerText && !!results[0].innerText.includes("-"))
        ) {
            return;
        }

        let csvLine = [tradePair, tradeInterval, [...settings]];
        // Add each numerical value from the result data to the result array
        for (const ele of results) {
            const innerText = await ele.evaluate((el) => el.innerText);
            csvLine.push(innerText.replace("\n", ",").trim());
        }

        console.log("Result CSVLine: ", csvLine.toString() + "\n");
        // Save the result array as a line in the output file
        fs.appendFile(FILENAME, csvLine.toString() + "\n", function (err) {
            if (err) throw err + "\nSPLIT: " + settings;
        });
    },
};

module.exports = moduleExports;
