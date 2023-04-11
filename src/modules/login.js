const { USERNAME, PASSWORD } = require("../config");

module.exports = {
    loginToTradingView: async function (page) {
        await page.waitForSelector(".tv-header__user-menu-button");
        await page.click(".tv-header__user-menu-button");

        await page.waitForTimeout(500);

        await page.waitForSelector(
            'button[data-name="header-user-menu-sign-in"]'
        );
        await page.click('button[data-name="header-user-menu-sign-in"]');

        await page.waitForSelector(".js-show-email");
        await page.click(".js-show-email");

        await page.waitForSelector('input[name="username"]');
        console.log("Username", USERNAME);
        await page.type('input[name="username"]', USERNAME);

        await page.waitForSelector('input[name="password"]');
        console.log("Password", PASSWORD);
        await page.type('input[name="password"]', PASSWORD);

        await page.keyboard.type(String.fromCharCode(13));
    },
};
