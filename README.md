# TradingViewPuppeteer

This file was created to Log in to Tradingview, Open a backtesting strategy, and enter all variations in the INPUT fields for the strategy, and record all positive results in to a CSV File.

You will need to have a range for each inputs, a 2d array called strategyInputs is where you enter this.
The variable STARTINGINPUT has been created for inputs to skip at the start, I have added this due to all my strats having a backtesting FROM and TO date inputs which I did not want it to change.

You will also need to enter you USERNAME, PASSWORD and chartId for Puppeteer to open.

For basic understanding and installation of Puppeteer, see https://pptr.dev/
