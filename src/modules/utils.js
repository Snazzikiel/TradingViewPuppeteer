// utils.js
const moduleExports = {
    setupUserAgent: async function (page) {
        // Pass the User-Agent Test.
        const userAgent =
            "Mozilla/5.0 (X11; Linux x86_64)" +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
        await page.setUserAgent(userAgent);
    },
    printEstimationRunTime: async function (strategyInputs) {
        let totalSeconds = 1 + strategyInputs.length / 5; //roughly 1second load and 1sec per 5inputs calculation

        for (let i = 0; i < strategyInputs.length; i++) {
            const { minValue, maxValue, isDecimalFlag } =
                moduleExports.getMinMaxValues(strategyInputs[i]);

            totalSeconds = totalSeconds * (maxValue - minValue + 1);
        }

        console.log("Time Started: " + new Date().toLocaleString());
        console.log(
            "Estimated Finish Time: " +
                new Date(
                    new Date().getTime() + totalSeconds * 1000
                ).toLocaleString()
        ); //add milliseconds to current time
        console.log("Seconds: " + totalSeconds);
        console.log("Minutes: " + (totalSeconds / 60).toFixed(2));
        console.log("Hours: " + (totalSeconds / 60 / 60).toFixed(2));
    },
    getMinMaxValues: function (inputRange) {
        const isDecimalFlag = !(
            inputRange[0].toString().indexOf(".") === -1 &&
            inputRange[1].toString().indexOf(".") === -1
        );
        const minValue = isDecimalFlag ? inputRange[0] * 10 : inputRange[0];
        const maxValue = isDecimalFlag ? inputRange[1] * 10 : inputRange[1];

        return { minValue, maxValue, isDecimalFlag };
    },
    setInputValue: async function (input, value, page) {
        await input.focus();

        const inputType = await input.evaluate((el) => el.type);

        if (inputType === "checkbox") {
            const isChecked = await input.evaluate((el) => el.checked);
            if (isChecked.toString() !== value.toString()) {
                await page.keyboard.press("Space");
            }
        } else {
            await page.keyboard.press("Home");
            await page.keyboard.down("Shift");
            await page.keyboard.press("End");
            await page.keyboard.up("Shift");
            await page.keyboard.press("Backspace");
            await page.keyboard.type(value);
        }
    },
    checkIfSelectorExists: async function (page, selector) {
        try {
            const element = await page.$(selector);
            return element !== null;
        } catch (error) {
            return false;
        }
    },
};

module.exports = moduleExports;
