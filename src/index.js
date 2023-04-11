// index.js
const puppeteer = require("puppeteer");
const {
    CHARTID,
    STARTINGINPUT,
    strategyInputs,
    CHARTTITLENAME,
} = require("./config");
const { setupUserAgent, printEstimationRunTime } = require("./modules/utils");
const { loginToTradingView } = require("./modules/login");
const {
    createNewFile,
    setAlgoSettingInputs,
} = require("./modules/backtesting");

(async () => {
    const browser = await puppeteer.launch({
        args: ["--start-maximized"],
        headless: false,
        /* slowMo: 50,*/ //uncomment this to slow down inputs
    });
    const page = await browser.newPage();
    await setupUserAgent(page);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto("https://www.tradingview.com/chart/" + CHARTID + "/");

    //print estimation runtime
    await printEstimationRunTime(strategyInputs);

    //Wait for page load and enter log in details
    await page.waitForSelector(".tv-header__user-menu-button");
    await loginToTradingView(page);

    await page.waitForSelector(
        '[data-strategy-title="' + CHARTTITLENAME + '"]'
    );
    await page.evaluate(() => {
        const strategyElement = document.querySelector(
            '[data-strategy-title="LongShort Strategy"]'
        );
        const buttonElement =
            strategyElement.nextElementSibling.querySelector("button");
        buttonElement.click();
    });

    //up to here
    await page.waitForSelector("[data-name='indicator-properties-dialog']");
    const inputElements = await page.$$(
        "[data-name='indicator-properties-dialog'] input"
    );

    await createNewFile(page);
    await setAlgoSettingInputs(0, "", inputElements, page);

    console.log("Time Ended: " + new Date().toLocaleString());
    await browser.close();
})();
