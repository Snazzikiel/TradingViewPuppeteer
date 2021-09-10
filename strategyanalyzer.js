const puppeteer = require('puppeteer');
const fs = require('fs');

const tmpInputName = 'DNShortOnly'; //Temporary file name to record what type of strat you are testing
const FILENAME = '-' + tmpInputName + '-' + (Math.random() + 1).toString(36).substring(7) + '.csv';

const USERNAME = 'XXXXXX@gmail.com';
const PASSWORD = 'XXXXX';
const CHARTID = 'XXXXXXXX'
const STARTINGINPUT = 4; //start at input #4 on strategy (to bypass date inputs)

//Simple RSI
const strategyInputs = [
    [12, 16],//length
    [27,33],//long range
    [67,73],//short range
    [1.1, 2.0],//tp
    [0.5, 1.2],//sl
    [0.3, 0.5]//trailingsl
];

const setupUserAgent = async (page) => {
  // Pass the User-Agent Test.
  const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
  await page.setUserAgent(userAgent);
}


(async () => {
    const browser = await puppeteer.launch({ args: [ '--start-maximized' ], headless: false/*, slowMo: 50*/});
    const page = await browser.newPage();
    await setupUserAgent(page);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('https://www.tradingview.com/chart/' + CHARTID + '/');

    //print estimation runtime
    await printEstimationRunTime();

    //Wait for page load and enter log in details
    await page.waitForSelector('.tv-header__user-menu-button');
    await loginToTradingView(page);

    await page.waitForSelector('.backtesting-head-wrapper');
    await page.evaluate( () => {
        document.getElementsByClassName('icon-button js-backtesting-open-format-dialog apply-common-tooltip')[0].click();
    });
    
    await page.waitForSelector('.wrapper-2cMrvu9r');
    await page.waitForSelector('.input-3bEGcMc9');
    let inputElements = await page.evaluateHandle( () => document.getElementsByClassName('input-3bEGcMc9 with-end-slot-S5RrC8PC')); //cannot delete all inputs here due to Backtesting data
    let inputs = await inputElements.getProperties();
    let ele = Array.from(inputs.values()).splice(STARTINGINPUT, inputs.size); //delete the first XX inputs due to date inputs not wanted);

    await createNewFile(page);
    await setAlgoSettingInputs(0, '', page, ele);

    console.log('Time Ended: ' + new Date().toLocaleString() );
    await browser.close();
})();

async function loginToTradingView(page){
    await page.evaluate( () => {
        let buttonPerson = document.getElementsByClassName('tv-header__user-menu-button')[0];
        buttonPerson.click();

        setTimeout(function () {
            let eles = document.getElementsByTagName('div');
            for (let i = 0; i < eles.length; i++){
                //console.log(eles[i].getAttribute('data-name'));
                if ( eles[i].getAttribute('data-name') == 'header-user-menu-sign-in'){
                    eles[i].click();
                }
            }

            let email = document.getElementsByClassName('tv-signin-dialog__social tv-signin-dialog__toggle-email js-show-email')[0];
            email.click();
        }, 500);
    });

    await page.waitForSelector('.i-clearfix');
    await page.click('.i-clearfix'),
   
    await page.waitForSelector('input[name="username"]');
    await page.click('input[name="username"]');
    await page.keyboard.type(USERNAME);
    await page.click('input[name="password"]');
    await page.keyboard.type(PASSWORD);
    await page.keyboard.type(String.fromCharCode(13));
}


async function setAlgoSettingInputs(pos, soFar, page, inputs){   

    await page.waitForSelector('.wrapper-2cMrvu9r');

    if ( pos >= strategyInputs.length){ 
      //console.log(soFar);
      await inputNewSettingsToPage(soFar, page, inputs);
      return;
    }

    let isDecimalFlag = !((strategyInputs[pos][0].toString().indexOf(".") == -1) && (strategyInputs[pos][0].toString().indexOf(".") == -1));
    let minValue = isDecimalFlag ? strategyInputs[pos][0] * 10 : strategyInputs[pos][0];
    let maxValue = isDecimalFlag ? strategyInputs[pos][1] * 10 : strategyInputs[pos][1];

    for(let i = minValue; i <=  maxValue; i++){
        let num = isDecimalFlag ? (i / 10 ) : i;
        await setAlgoSettingInputs(pos+1, soFar + ',' + num, page, inputs );
    }
}

async function inputNewSettingsToPage(allSettings, page, inputs){
    let settingSplit = allSettings.substring(1).split(",");

    if ( settingSplit.length == inputs.length){
        for(let i = 0; i < settingSplit.length; i++){
            await inputs[i].focus();
            await page.keyboard.press('Home');
            await page.keyboard.down('Shift');
            await page.keyboard.press('End');
            await page.keyboard.up('Shift');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(settingSplit[i]);
        }
    }

    await page.keyboard.press('Enter');
    await createStringAndSaveData(page, settingSplit);
}

const largestProfit = '';
const largestNetProfit = '';
const largestProfitPerc = '';
const largestProfitFact = '';

async function createStringAndSaveData(page, settingSplit){

    await page.waitForTimeout(1500);
    await page.waitForSelector('.report-data');
    const resultData = await page.$eval('.report-data', element => element.innerText.split('\n').filter(el => !!el.trim() ));
    const tradePair = await page.$eval('#header-toolbar-symbol-search', element => element.innerText);
    const tradeInterval = await page.$eval('#header-toolbar-intervals', element => element.innerText);
    
    if ( resultData.toString().includes('Profit Factor') && !resultData.toString().includes('-')){ //don't record if no profit factor or if there is any negative values
        let resultArray = [tradePair, tradeInterval, [...settingSplit]];

        resultData.forEach( ele => {
            if ( !/[a-z]/i.test(ele) ){
                resultArray.push(ele.replace(/\s/g,''));//remove white spaces (if negative value)
            }
        });

        fs.appendFile(FILENAME, resultArray.toString()+ '\n', function (err) {
                if ( err ) throw err + '\nSPLIT: ' + settingSplit;
            }
        );
    }
}

async function createNewFile(page){

    const tradePair = await page.$eval('#header-toolbar-symbol-search', element => element.innerText);
    const tradeInterval = await page.$eval('#header-toolbar-intervals', element => element.innerText);
    FILENAME = tradePair + "-" + tradeInterval + "-" + FILENAME;
    let headerInfo = 'TradePair,TimeFrame';

    let i = 1;
    strategyInputs.forEach( ele => {
        headerInfo += ',Input' + i++;
    })

    headerInfo += ',NetProfit $';
    headerInfo += ',NetProfit %';
    headerInfo += ',Total Closed Trades';
    headerInfo += ',Percent Profitable';
    headerInfo += ',Profit Factor';
    headerInfo += ',Max Drawdown $';
    headerInfo += ',Max Drawdown %';
    headerInfo += ',Average Trade $';
    headerInfo += ',Average Trade %';
    headerInfo += ',Average # Bars in Trade';
    headerInfo += '\n';

    console.log("Filename: " + FILENAME);
    fs.writeFile(FILENAME, headerInfo, function (err) {
            if ( err ) throw err;
        }
    );
}

async function printEstimationRunTime(){

    let totalSeconds = 1 + (strategyInputs.length / 5); //roughly 1second load and 1sec per 5inputs calculation

    for(let i = 0; i < strategyInputs.length; i++){
        let isDecimalFlag = !((strategyInputs[i][0].toString().indexOf(".") == -1) && (strategyInputs[i][0].toString().indexOf(".") == -1));
        let minValue = isDecimalFlag ? strategyInputs[i][0] * 10 : strategyInputs[i][0];
        let maxValue = isDecimalFlag ? strategyInputs[i][1] * 10 : strategyInputs[i][1];

        totalSeconds = totalSeconds * (maxValue - minValue + 1);
    }

    
    console.log('Time Started: ' + new Date().toLocaleString() );
    console.log('Estimated Finish Time: ' + new Date(new Date().getTime() + (totalSeconds * 1000)).toLocaleString()); //add milliseconds to current time
    console.log('Seconds: ' + totalSeconds);
    console.log('Minutes: ' + (totalSeconds / 60).toFixed(2) );
    console.log('Hours: ' + ((totalSeconds / 60) / 60).toFixed(2) );
}
