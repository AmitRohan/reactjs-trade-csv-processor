import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';
import React, { Component } from 'react';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioDetails from './components/PortfolioDetails';
import { AppBar, Backdrop, Button, CircularProgress, IconButton, Toolbar, Typography } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
const CSVPasrse = require('csv-parse');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

//use ["ALL"] to support all coins
const whiteListCoins = ["ALL"];
const blackListCoins = ["SOUL"];
const LOCAL_DATA = "XYZZYSPOON!"

const defaultCoinObject = {
  coinsOwned : 0,
  currentValue : 0,
  fee : 0,
  moneyInvested : 0,
  moneyInvestedWithFees : 0
};

const emptyState = {
  fileUploaded: false,
  showLoader : false,
  postProcessingDone : false,
  postProcessingCheckpoints : 0,
  fileData : [],
  allCoinData : [],
  allCoinCoinGeckoId : [],
  allCoinPrice : [],
  allSuportedCoins : [],
  selectedCoinData : defaultCoinObject,
  selectedCoinHistoricPrice : [],
  selectedCoinDataSet : [],
  selectedCoinPrice : -1,
  selectedCoinToken : ""
}

class App extends Component {
  postProcessingCheckpointCounter = 0;
  constructor(props) {
    super(props);
    this.state = emptyState

    var cachedData = JSON.parse(localStorage.getItem(LOCAL_DATA));
    if(cachedData != null && Array.isArray(cachedData)){
      console.log("Data alrady cached",cachedData)

      this.initialProcessingChecks();
      setTimeout( () => {
        this.handleProcessedData(cachedData)
      },200)
      
    }
  }

  initialProcessingChecks = () => {
    this.postProcessingCheckpointCounter = 0;
    var postProcessingCheckpoints = 999999;
    this.setState({ postProcessingCheckpoints , postProcessingDone : false, showLoader : true});
  }


  handleProcessedData = (fileData) => {

    localStorage.setItem(LOCAL_DATA,JSON.stringify(fileData))

    this.setState({ fileUploaded: true, fileData});
          
    var coinDataAnalyzer = this.getCoinDataAnalyzer(0);
    var allSuportedCoins = this.getAllCoinsFromReport(fileData)
                    .filter( coinName => 
                      (this
                        .getCoinDataFromReport(coinName)
                        .reduce(coinDataAnalyzer,Object.assign({},defaultCoinObject))
                        .coinsOwned > 0)
                    )
    
    // REMOVE COINS NOT PRESENT IN WHITE LABEL
    allSuportedCoins = allSuportedCoins.filter( coin =>{
      return ( -1 !== whiteListCoins.indexOf("ALL") || -1 !== whiteListCoins.indexOf(coin) )
    })

    // REMOVE COINS PRESENT IN BLACK LABEL
    allSuportedCoins = allSuportedCoins.filter( coin =>{
      return ( -1 !== blackListCoins.indexOf("ALL") || -1 === blackListCoins.indexOf(coin) )
    })

    this.setState( { allSuportedCoins })
    this.updateLatestCoinPricesFromCoinGecko();
  }

  handleFiles = files => {

    this.initialProcessingChecks()

    var reader = new FileReader();
    reader.onload = (e) => {
        // Use reader.result
        CSVPasrse(reader.result, {columns: true, trim: true}, (err,fileData) => {
          this.handleProcessedData(fileData);
        }) 
    }
    reader.readAsText(files[0]);
  }

  getCoinDataFromReport = (selectedCoinToken) => {
    return this.state.fileData.filter( row => (row.Coin.toLowerCase() === selectedCoinToken.toLowerCase()));
  }

  getAllCoinsFromReport = (report) => {
    return [...new Set(report.map((row) => row.Coin))] 
  }

  getCoinDataAnalyzer = (coinPrice) => {
      return (prevTransaction,currentTransaction) => {
        var newRecord = Object.assign({},prevTransaction);
        
        if(currentTransaction.SIDE==='BUY'){
          newRecord.coinsOwned += parseFloat(currentTransaction.Crypto_Amt)
          newRecord.moneyInvested -= ((parseFloat(currentTransaction.Crypto_Amt)) * (parseFloat(currentTransaction.Rate)))
          newRecord.moneyInvestedWithFees -= parseFloat(currentTransaction.FIAT)
        }else{
          newRecord.coinsOwned -= parseFloat(currentTransaction.Crypto_Amt)
          newRecord.moneyInvested += ((parseFloat(currentTransaction.Crypto_Amt)) * (parseFloat(currentTransaction.Rate)))
          newRecord.moneyInvestedWithFees += parseFloat(currentTransaction.FIAT)
        }
        
        newRecord.fee += parseFloat(currentTransaction.Fee)
        newRecord.currentValue = (newRecord.coinsOwned * coinPrice)

        if(newRecord.currentValue !== 0)
          newRecord.currentValue -= newRecord.fee
    
        return newRecord  
      }
  }
  
  postProcessingCheckpoints = 0;
  
  // var coinSymbol = coinResp.symbol.toLowerCase();

  // Updates coin price at indes in state
  fetchCoinDataUsingId = (cb) => {
    var index = this.postProcessingCheckpointCounter

    if(this.state.allCoinCoinGeckoId[index] === undefined){
      cb();
      return;
    }

    CoinGeckoClient
      .coins
      .fetch(this.state.allCoinCoinGeckoId[index], {})
      .then(coinDataReponse => {
          const coinPrice = coinDataReponse.data.market_data.current_price.inr
          var allCoinPrice = this.state.allCoinPrice;
          allCoinPrice[index] = coinPrice
          this.setState({ allCoinPrice })     

          var coinDataSet = this.getCoinDataFromReport(this.state.allSuportedCoins[index]);
          var defaultResp = Object.assign({},defaultCoinObject);
          var coinData = coinDataSet.reduce(this.getCoinDataAnalyzer(coinPrice),defaultResp);
          
          var allCoinData = this.state.allCoinData;
          allCoinData[index] = coinData
          this.setState({ allCoinData })


          cb();
      }).catch(err => {
        console.log(err)
        cb();
      });
  }

  updateLatestCoinPricesFromCoinGecko = () => {
    CoinGeckoClient
        .coins
        .list()
        .then(resp => {
            if(resp.code !== 200){
                return;
            }
            var suportedResponse = resp.data.filter( coinResp => {
              return (-1 !== this.state.allSuportedCoins.indexOf(coinResp.symbol.toUpperCase()))
            });
            // Set Checkpoint Size
            this.postProcessingCheckpointCounter = 0;
            var postProcessingCheckpoints = suportedResponse.length;
            this.setState({ postProcessingCheckpoints });
            
            var allCoinCoinGeckoId = this.state.allCoinCoinGeckoId;
            suportedResponse.forEach( coinResp => {
                var coinSymbol = coinResp.symbol.toLowerCase();
                var indexInSuportedCoins = this.state.allSuportedCoins.indexOf(coinSymbol.toUpperCase())
                allCoinCoinGeckoId[indexInSuportedCoins] = coinResp.id
            })
            this.setState({ allCoinCoinGeckoId });
            var toRepeat = () => {
              if(postProcessingCheckpoints <= this.postProcessingCheckpointCounter
                  && !this.state.postProcessingDone){
                this.setState({ postProcessingDone : true, showLoader : false})
                return;
              }
              this.fetchCoinDataUsingId(() => { 
                this.postProcessingCheckpointCounter++;
                toRepeat();
              })
            }
            toRepeat();


    }).catch(console.log);
  }

  fetchSelectedCoinIdFromCoinGecko = () => {
    CoinGeckoClient
        .coins
        .list()
        .then(resp => {
            if(resp.code !== 200){
                return;
            }
            resp.data.forEach( coinResp => {
                var coinSymbol = coinResp.symbol.toLowerCase();
                if(coinSymbol === this.state.selectedCoinToken.toLowerCase()){
                    
                    // Get Data
                    this.fetchCoinPrice(coinResp.id)
                    this.fetchHistoricPrices(coinResp.id)
            }
        })
    }).catch(console.log);
  }

  fetchCoinPrice = (coinId) => {
    CoinGeckoClient
      .coins
      .fetch(coinId, {})
      .then(coinDataReponse => {
          // const selectedCoinPrice = 1
          const selectedCoinPrice = coinDataReponse.data.market_data.current_price.inr
          this.updateSelectedCoinInState(selectedCoinPrice);
      }).catch(console.log);
  }

  fetchHistoricPrices = (coinId) => {
    CoinGeckoClient
      .coins
      .fetchMarketChart(coinId, {days : 91, vs_currency : 'inr' , interval : 'daily '})
      .then(coinMarketChartData => {
          const selectedCoinHistoricPrice = coinMarketChartData
                                              .data
                                              .prices
        this.setState( { selectedCoinHistoricPrice });
      }).catch(console.log);
  }

  // UI EVENTS

  downloadSampleCSV = () => {
    const rows = [
      ["2021-11-19 04:01:53",269,0.00,4854.11,18.00,12.11,"DOGE purchased",9656344,"DOGE","INR","BUY"],
["2021-11-18 14:47:03",505,9695.44,9695.44,19.25,24.30,"DOGE sold",9656334,"DOGE","INR","SELL"],
["2021-11-15 11:47:56",4.88,7136.39,7136.39,1466.04,17.89,"CAKE sold",4097208,"CAKE","INR","SELL"],
["2021-11-15 10:57:25",3.06,4433.41,4433.41,1452.46,11.12,"CAKE sold",4096639,"CAKE","INR","SELL"],
["2021-11-15 10:51:42",0.0092,0.00,3390.91,367658.26,8.46,"ETH purchased",12977489,"ETH","INR","BUY"],
["2021-11-15 10:50:40",0.12,173.86,173.86,1452.45,0.44,"CAKE sold",4096640,"CAKE","INR","SELL"],
["2021-11-15 10:50:40",0.12,173.86,173.86,1452.45,0.44,"CAKE sold",4096641,"CAKE","INR","SELL"],
["2021-11-15 10:50:16",2.06,2984.58,2984.58,1452.46,7.49,"CAKE sold",4096639,"CAKE","INR","SELL"],
["2021-11-11 13:38:22",26,0.00,546.32,20.96,1.37,"DOGE purchased",9511009,"DOGE","INR","BUY"],
["2021-11-11 08:20:58",496,0.00,10123.81,20.36,25.25,"DOGE purchased",9495945,"DOGE","INR","BUY"],
["2021-11-11 04:56:19",500,10631.35,10631.35,21.32,26.65,"DOGE sold",9495880,"DOGE","INR","SELL"],
["2021-11-10 00:54:11",0.5112,0.02,10001.03,19515.04,24.95,"SOL purchased",8308528,"SOL","INR","BUY"],
["2021-11-10 00:53:42",0.5112,0.49,10001.03,19515.04,24.95,"SOL purchased",8308526,"SOL","INR","BUY"],
["2021-11-07 17:33:51",5,0.00,104.71,20.89,0.27,"DOGE purchased",9406568,"DOGE","INR","BUY"],
["2021-11-06 18:48:13",8.3606,0.00,85.99,10.26,0.22,"BNS purchased",1459277,"BNS","INR","BUY"],
["2021-11-06 18:46:04",118.51,9510.29,9510.29,80.45,23.84,"USDT sold",4509942,"USDT","INR","SELL"],
["2021-11-06 18:45:33",15.85,1271.95,1271.95,80.45,3.19,"USDT sold",4509942,"USDT","INR","SELL"],
["2021-11-06 18:45:17",12.77,1024.78,1024.78,80.45,2.57,"USDT sold",4509942,"USDT","INR","SELL"],
["2021-11-06 18:44:54",24.25,1946.04,1946.04,80.45,4.88,"USDT sold",4509942,"USDT","INR","SELL"],
["2021-11-06 18:44:46",16.62,1333.73,1333.73,80.45,3.35,"USDT sold",4509942,"USDT","INR","SELL"],
["2021-11-06 18:42:24",20.3035,0.00,209.24,10.28,0.53,"BNS purchased",1459244,"BNS","INR","BUY"],
["2021-11-06 09:42:31",52,4800.57,4800.57,92.55,12.04,"XRP sold",14855194,"XRP","INR","SELL"],
["2021-11-06 09:42:27",240,22156.47,22156.47,92.55,55.53,"XRP sold",14855194,"XRP","INR","SELL"],
["2021-11-05 19:33:02",99.56,9429.59,9429.59,94.95,23.64,"XRP sold",14843655,"XRP","INR","SELL"],
["2021-11-05 19:32:34",0.25,23.68,23.68,94.95,0.06,"XRP sold",14843655,"XRP","INR","SELL"],
["2021-11-05 19:32:10",192.41,18223.65,18223.65,94.95,45.68,"XRP sold",14843655,"XRP","INR","SELL"],
["2021-11-05 16:00:06",584.22,0.00,56049.63,95.70,139.78,"XRP purchased",14836921,"XRP","INR","BUY"],
["2021-11-02 21:00:46",82.8745,0.00,854.08,10.28,2.13,"BNS purchased",1439412,"BNS","INR","BUY"],
["2021-11-02 21:00:37",100,0.00,1030.57,10.28,2.57,"BNS purchased",1439412,"BNS","INR","BUY"],
["2021-11-02 21:00:29",100,0.00,1030.57,10.28,2.57,"BNS purchased",1439412,"BNS","INR","BUY"],
["2021-11-02 21:00:17",100,0.00,1030.57,10.28,2.57,"BNS purchased",1439412,"BNS","INR","BUY"],
["2021-11-02 21:00:17",100,0.00,1030.57,10.28,2.57,"BNS purchased",1439412,"BNS","INR","BUY"],
["2021-11-02 20:59:43",885405,4959.16,4959.16,0.01,0.00,"SHIB sold",5013976,"SHIB","INR","SELL"],
["2021-11-02 18:41:33",0.0144,0.00,4996.07,346083.75,12.46,"ETH purchased",12695609,"ETH","INR","BUY"],
["2021-11-02 18:40:17",123715,698.25,698.25,0.01,0.00,"SHIB sold",5010134,"SHIB","INR","SELL"],
["2021-11-02 18:40:17",761690,4280.70,4280.70,0.01,0.00,"SHIB sold",5010134,"SHIB","INR","SELL"],
["2021-11-01 20:41:57",0.0099,0.00,3424.03,344999.32,8.54,"ETH purchased",12669137,"ETH","INR","BUY"],
["2021-11-01 20:30:16",7703,44.77,44.77,0.01,0.12,"SHIB sold",4972681,"SHIB","INR","SELL"],
["2021-11-01 20:30:16",582567,3386.13,3386.13,0.01,8.49,"SHIB sold",4972681,"SHIB","INR","SELL"],
["2021-11-01 11:01:12",41,0.00,921.11,22.41,2.30,"DOGE purchased",9235832,"DOGE","INR","BUY"],
["2021-11-01 11:00:41",0.0001,0.01,0.01,1.12,0.00,"RAGE sold",54519,"RAGE","INR","SELL"],
["2021-11-01 11:00:20",376.2928,421.45,421.45,1.12,0.00,"RAGE sold",54519,"RAGE","INR","SELL"],
["2021-11-01 10:55:41",437.9846,490.55,490.55,1.12,0.00,"RAGE sold",54519,"RAGE","INR","SELL"],
["2021-11-01 10:55:41",1.9553,2.19,2.19,1.12,0.00,"RAGE sold",54519,"RAGE","INR","SELL"],
["2021-10-29 01:18:27",264,0.00,6219.51,23.50,15.51,"DOGE purchased",9024309,"DOGE","INR","BUY"],
["2021-10-29 00:44:15",259,0.00,6231.54,24.00,15.54,"DOGE purchased",9024295,"DOGE","INR","BUY"],
["2021-10-28 21:57:42",231,0.00,5326.28,23.00,13.29,"DOGE purchased",9000994,"DOGE","INR","BUY"],
["2021-10-28 17:33:19",100,0.00,2265.65,22.60,5.65,"DOGE purchased",8985046,"DOGE","INR","BUY"],
["2021-10-28 17:31:21",161,0.00,3712.26,23.00,9.26,"DOGE purchased",8985064,"DOGE","INR","BUY"],
["2021-10-28 17:24:20",1000,23695.61,23695.61,23.76,59.39,"DOGE sold",8984875,"DOGE","INR","SELL"],
["2021-10-28 17:20:46",439,0.00,11046.45,25.10,27.55,"DOGE purchased",8983858,"DOGE","INR","BUY"],
["2021-10-28 17:14:43",2361080,11048.14,11048.14,0.00,27.69,"SHIB sold",4738880,"SHIB","INR","SELL"],
["2021-10-28 06:58:39",606822,0.00,6083.39,0.01,9.64,"SHIB purchased",4690494,"SHIB","INR","BUY"],
["2021-10-28 06:46:43",147518,0.14,1478.87,0.01,2.24,"SHIB purchased",4689419,"SHIB","INR","BUY"],
["2021-10-28 06:45:18",773985,0.00,7759.2,0.01,11.87,"SHIB purchased",4689221,"SHIB","INR","BUY"],
["2021-10-28 06:44:47",500,9486.72,9486.72,19.02,23.78,"DOGE sold",8953996,"DOGE","INR","SELL"],
["2021-10-27 22:14:34",1689293,10.16,0,0.00,18.97,"SHIB purchased",4650331,"SHIB","INR","BUY"],
["2021-10-27 22:14:08",254,4788.59,4788.59,18.90,12.01,"DOGE sold",8927798,"DOGE","INR","SELL"],
["2021-10-27 22:14:08",151,2846.76,2846.76,18.90,7.14,"DOGE sold",8927798,"DOGE","INR","SELL"],
["2021-10-27 21:12:27",635121,0.00,0,0.00,6.77,"SHIB purchased",4647746,"SHIB","INR","BUY"],
["2021-10-27 21:12:27",640480,0.00,0,0.00,6.83,"SHIB purchased",4647746,"SHIB","INR","BUY"],
["2021-10-27 21:11:59",135,2492.74,2492.74,18.51,6.25,"DOGE sold",8923407,"DOGE","INR","SELL"],
["2021-10-27 21:11:54",160,2954.35,2954.35,18.51,7.41,"DOGE sold",8923407,"DOGE","INR","SELL"],
["2021-10-27 18:13:44",158036,0.00,0,0.00,1.80,"SHIB purchased",4635054,"SHIB","INR","BUY"],
["2021-10-27 18:13:07",21,418.95,418.95,20.00,1.05,"DOGE sold",8911971,"DOGE","INR","SELL"],
["2021-10-27 18:11:58",15,300.52,300.52,20.09,0.76,"DOGE sold",8911957,"DOGE","INR","SELL"],
["2021-10-27 18:11:22",70905,0.00,0,0.00,0.83,"SHIB purchased",4634797,"SHIB","INR","BUY"],
["2021-10-27 18:10:45",27.7388,286.94,286.94,10.37,0.72,"BNS sold",1408799,"BNS","INR","SELL"],
["2021-10-26 07:04:39",63,0.06,1319.99,20.90,3.30,"DOGE purchased",8871995,"DOGE","INR","BUY"],
["2021-10-26 07:04:02",0.00026809,1306.44,1306.44,4885371.79,3.28,"BTC sold",12735587,"BTC","INR","SELL"],
["2021-10-25 11:43:25",6,0.00,129.02,21.45,0.33,"DOGE purchased",8842915,"DOGE","INR","BUY"],
["2021-10-25 11:42:16",280,14.03,5964.88,21.25,14.88,"DOGE purchased",8842849,"DOGE","INR","BUY"],
["2021-10-25 11:39:45",34149138,6097.41,6097.41,0.00,15.29,"SAFEMOON sold",499090,"SAFEMOON","INR","SELL"],
["2021-10-24 18:07:53",12.21,1029.29,1029.29,84.51,2.58,"XRP sold",14526571,"XRP","INR","SELL"],
["2021-10-24 18:02:25",1,84.29,84.29,84.51,0.22,"XRP sold",14526571,"XRP","INR","SELL"],
["2021-10-24 17:56:31",59,4973.62,4973.62,84.51,12.47,"XRP sold",14526571,"XRP","INR","SELL"],
["2021-10-24 17:55:31",1.74,146.68,146.68,84.51,0.37,"XRP sold",14526571,"XRP","INR","SELL"],
["2021-10-22 20:05:58",12133432,2142.25,2142.25,0.00,5.37,"SAFEMOON sold",492617,"SAFEMOON","INR","SELL"],
["2021-10-22 20:05:58",450847,79.60,79.60,0.00,0.20,"SAFEMOON sold",492617,"SAFEMOON","INR","SELL"],
["2021-10-22 20:05:58",21564858,3807.43,3807.43,0.00,9.55,"SAFEMOON sold",492617,"SAFEMOON","INR","SELL"],
["2021-10-22 17:58:38",177,0.00,3392.7,19.12,8.46,"DOGE purchased",8753345,"DOGE","INR","BUY"],
["2021-10-22 17:06:00",100,0.00,1077.69,10.75,2.69,"BNS purchased",1379368,"BNS","INR","BUY"],
["2021-10-22 17:03:47",1279,0.00,2205.38,1.72,5.50,"BNSD purchased",356147,"BNSD","INR","BUY"],
["2021-10-22 17:03:15",391,0.00,674.2,1.72,1.68,"BNSD purchased",356147,"BNSD","INR","BUY"],
["2021-10-22 17:00:55",2144,0.00,3696.9,1.72,9.21,"BNSD purchased",356144,"BNSD","INR","BUY"],
["2021-10-22 17:00:55",18,0.00,31.04,1.72,0.08,"BNSD purchased",356144,"BNSD","INR","BUY"],
["2021-10-22 16:52:02",2570341,458.94,458.94,0.00,1.16,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:51:22",50000,8.92,8.92,0.00,0.03,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:51:22",30371,5.42,5.42,0.00,0.02,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:49:37",278631,49.75,49.75,0.00,0.13,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:48:41",221233,39.51,39.51,0.00,0.10,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:47:40",3343575,597.00,597.00,0.00,1.50,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:46:56",6983318,1246.89,1246.89,0.00,3.13,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:46:52",278631,49.75,49.75,0.00,0.13,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:45:42",670,0.00,1121.7,1.67,2.80,"BNSD purchased",356139,"BNSD","INR","BUY"],
["2021-10-22 16:44:23",20835808,3720.28,3720.28,0.00,9.33,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:44:23",5650223,1008.86,1008.86,0.00,2.53,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:44:23",27777541,4959.74,4959.74,0.00,12.44,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 16:44:23",278603,49.74,49.74,0.00,0.13,"SAFEMOON sold",492263,"SAFEMOON","INR","SELL"],
["2021-10-22 09:29:27",46.2592,0.00,498.99,10.76,1.25,"BNS purchased",1378301,"BNS","INR","BUY"],
["2021-10-22 09:27:02",1416,0.00,2399.02,1.69,6.00,"BNSD purchased",356047,"BNSD","INR","BUY"],
["2021-10-22 09:24:37",300,0.00,508.27,1.69,1.27,"BNSD purchased",356044,"BNSD","INR","BUY"],
["2021-10-22 09:24:05",2784722,499.99,499.99,0.00,1.26,"SAFEMOON sold",491677,"SAFEMOON","INR","SELL"],
["2021-10-22 09:23:32",46.1225,0.00,497.98,10.77,1.25,"BNS purchased",1378287,"BNS","INR","BUY"],
["2021-10-22 09:23:05",2784722,499.99,499.99,0.00,1.26,"SAFEMOON sold",491676,"SAFEMOON","INR","SELL"],
["2021-10-22 09:21:52",24.2125,0.00,261.42,10.77,0.66,"BNS purchased",1378283,"BNS","INR","BUY"],
["2021-10-22 09:20:16",784,0.00,1328.27,1.69,3.32,"BNSD purchased",356044,"BNSD","INR","BUY"],
["2021-10-22 09:15:45",20,0.00,215.94,10.77,0.54,"BNS purchased",1378267,"BNS","INR","BUY"],
["2021-10-22 09:08:56",0.9347,0.00,10.08,10.76,0.03,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:57:59",100,0.00,1078.69,10.76,2.69,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:57:42",100,0.00,1078.69,10.76,2.69,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:57:42",0.9352,0.00,10.09,10.76,0.03,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:57:42",18,0.00,194.16,10.76,0.49,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:57:34",100,0.00,1078.69,10.76,2.69,"BNS purchased",1378253,"BNS","INR","BUY"],
["2021-10-22 08:56:54",1.1321,0.00,12.2,10.75,0.04,"BNS purchased",1378250,"BNS","INR","BUY"],
["2021-10-22 08:56:54",9.1832,0.00,98.97,10.75,0.25,"BNS purchased",1378250,"BNS","INR","BUY"],
["2021-10-22 08:56:46",205.0364,0.00,2209.65,10.75,5.52,"BNS purchased",1378250,"BNS","INR","BUY"],
["2021-10-22 08:56:46",100,0.00,1077.69,10.75,2.69,"BNS purchased",1378250,"BNS","INR","BUY"],
["2021-10-22 08:40:31",100,0.00,1076.69,10.74,2.69,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:23",9.4238,0.00,101.46,10.74,0.26,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:23",9.4238,0.00,101.46,10.74,0.26,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:23",0.941,0.00,10.13,10.74,0.03,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:23",8.473,0.00,91.23,10.74,0.23,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:19",100,0.00,1076.69,10.74,2.69,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 08:40:15",100,0.00,1076.69,10.74,2.69,"BNS purchased",1378236,"BNS","INR","BUY"],
["2021-10-22 02:16:39",0.288405,0.00,92627.29,320369.97,231.00,"ETH purchased",12312230,"ETH","INR","BUY"],
["2021-10-22 02:15:54",0.0113,0.00,3629.23,320369.97,9.06,"ETH purchased",12312230,"ETH","INR","BUY"],
["2021-10-22 02:15:50",0.008895,0.00,2856.82,320369.97,7.13,"ETH purchased",12312230,"ETH","INR","BUY"],
["2021-10-22 02:14:40",0.02010079,99209.68,99209.68,4947981.08,248.65,"BTC sold",12631846,"BTC","INR","SELL"],
["2021-10-21 10:40:59",4.3046,0.00,46.39,10.75,0.12,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:40:51",2.6193,0.00,28.23,10.75,0.08,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:45",9.4149,0.00,101.46,10.75,0.26,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:45",2.1647,0.00,23.33,10.75,0.06,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:37",102.2191,0.00,1101.6,10.75,2.75,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:37",5.0351,0.00,54.26,10.75,0.14,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:37",25.045,0.00,269.91,10.75,0.68,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:37",0.067,0.00,0.72,10.75,0.01,"BNS purchased",1372438,"BNS","INR","BUY"],
["2021-10-21 10:36:01",100,0.00,1076.69,10.74,2.69,"BNS purchased",1372433,"BNS","INR","BUY"],
["2021-10-21 10:35:57",411.426,0.00,4433.89,10.75,11.06,"BNS purchased",1372435,"BNS","INR","BUY"],
["2021-10-21 10:35:49",100,0.00,1076.69,10.74,2.69,"BNS purchased",1372433,"BNS","INR","BUY"],
["2021-10-21 10:35:44",100,0.00,1076.69,10.74,2.69,"BNS purchased",1372433,"BNS","INR","BUY"],
["2021-10-21 10:35:24",20.2295,0.00,217,10.70,0.55,"BNS purchased",1372429,"BNS","INR","BUY"],
["2021-10-21 10:35:24",0.9366,0.00,10.05,10.70,0.03,"BNS purchased",1372429,"BNS","INR","BUY"],
["2021-10-21 10:35:24",18.6477,0.00,200.03,10.70,0.50,"BNS purchased",1372429,"BNS","INR","BUY"],
["2021-10-21 10:35:16",100,0.00,1076.69,10.74,2.69,"BNS purchased",1372417,"BNS","INR","BUY"],
["2021-10-21 10:14:14",9.4362,0.00,101.41,10.72,0.26,"BNS purchased",1372355,"BNS","INR","BUY"],
["2021-10-21 10:14:14",3.383,0.00,36.36,10.72,0.10,"BNS purchased",1372355,"BNS","INR","BUY"],
["2021-10-21 10:14:10",100,0.00,1074.68,10.72,2.68,"BNS purchased",1372355,"BNS","INR","BUY"],
["2021-10-21 10:13:35",0.1119,0.00,35958.73,320545.66,89.68,"ETH purchased",12283477,"ETH","INR","BUY"],
["2021-10-21 10:13:11",0.09968883,0.00,32030.15,320500.00,79.88,"ETH purchased",12283475,"ETH","INR","BUY"],
["2021-10-21 10:12:52",0.0157226,79999.97,79999.97,5100967.53,200.51,"BTC sold",12611378,"BTC","INR","SELL"],
["2021-10-21 10:11:28",0.03612888,0.00,185920.12,5133192.15,463.65,"BTC purchased",12611354,"BTC","INR","BUY"],
["2021-10-21 10:10:41",8118,7069.30,7069.30,0.87,17.72,"CVT sold",386135,"CVT","INR","SELL"],
["2021-10-21 10:08:48",566,496.83,496.83,0.88,1.25,"CVT sold",386125,"CVT","INR","SELL"],
["2021-10-21 09:51:00",1013.93,2255.41,2255.41,2.23,5.66,"QKC sold",367737,"QKC","INR","SELL"],
["2021-10-21 09:47:22",6.279E-5,0.00,323.12,5133154.75,0.81,"BTC purchased",12611127,"BTC","INR","BUY"],
["2021-10-21 09:44:54",141624416,26135.01,26135.01,0.00,65.51,"SAFEMOON sold",487392,"SAFEMOON","INR","SELL"],
["2021-10-21 09:44:22",5392,0.99,0.99,0.00,0.01,"SAFEMOON sold",487392,"SAFEMOON","INR","SELL"],
["2021-10-21 09:43:09",536186,99.49,99.49,0.00,0.25,"SAFEMOON sold",487392,"SAFEMOON","INR","SELL"],
["2021-10-21 09:41:57",875387,162.42,162.42,0.00,0.41,"SAFEMOON sold",487380,"SAFEMOON","INR","SELL"],
["2021-10-21 09:41:32",0.03889999,0.00,12500.32,320543.69,31.18,"ETH purchased",12282921,"ETH","INR","BUY"],
["2021-10-21 09:41:24",0.1167,0.00,37500.97,320543.69,93.52,"ETH purchased",12282919,"ETH","INR","BUY"],
["2021-10-21 09:41:13",5363,0.99,0.99,0.00,0.01,"SAFEMOON sold",487380,"SAFEMOON","INR","SELL"],
["2021-10-21 09:40:53",206065934,37410.24,37410.24,0.00,93.76,"SAFEMOON sold",487383,"SAFEMOON","INR","SELL"],
["2021-10-21 09:40:17",5357498,994.00,994.00,0.00,2.50,"SAFEMOON sold",487380,"SAFEMOON","INR","SELL"],
["2021-10-21 09:39:10",50000000,0.00,0,0.00,23.38,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:39:10",3500000,0.00,0,0.00,1.64,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:39:09",1000000,0.00,0,0.00,0.47,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:39:09",5656000,0.00,0,0.00,2.65,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:39:09",188207547,0.00,0,0.00,87.99,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:39:09",53766906,0.00,0,0.00,25.14,"SAFEMOON purchased",487374,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:57",5405,0.00,0,0.00,0.01,"SAFEMOON purchased",487372,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:57",3500000,0.00,0,0.00,1.63,"SAFEMOON purchased",487372,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:57",44353776,0.00,0,0.00,20.63,"SAFEMOON purchased",487372,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:57",6445036,0.00,0,0.00,3.00,"SAFEMOON purchased",487372,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:57",994595,0.00,0,0.00,0.47,"SAFEMOON purchased",487372,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:33",3500000,0.00,0,0.00,1.62,"SAFEMOON purchased",487370,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:33",1000000,0.00,0,0.00,0.47,"SAFEMOON purchased",487370,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:33",32351351,0.00,0,0.00,14.97,"SAFEMOON purchased",487370,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:33",500000,0.00,0,0.00,0.24,"SAFEMOON purchased",487370,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:25",3500000,0.00,0,0.00,1.61,"SAFEMOON purchased",487369,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:25",141299,0.00,0,0.00,0.07,"SAFEMOON purchased",487369,"SAFEMOON","INR","BUY"],
["2021-10-21 09:38:17",2215854,0.00,0,0.00,1.02,"SAFEMOON purchased",487368,"SAFEMOON","INR","BUY"],
["2021-10-21 09:35:22",0.01943316,0.00,100002.76,5133152.61,249.39,"BTC purchased",12611062,"BTC","INR","BUY"],
["2021-10-21 09:34:05",73587701,0.00,0,0.00,33.49,"SAFEMOON purchased",487364,"SAFEMOON","INR","BUY"],
["2021-10-21 09:24:47",1210,0.00,24114.94,19.88,60.15,"DOGE purchased",8716003,"DOGE","INR","BUY"],
["2021-10-21 09:23:27",0.2,0.00,64269.01,320543.69,160.28,"ETH purchased",12282652,"ETH","INR","BUY"],
["2021-10-21 09:19:17",0.0001,0.00,31.96,318827.96,0.08,"ETH purchased",12282528,"ETH","INR","BUY"],
["2021-10-21 09:15:52",0.005,0.00,1604.27,320053.95,4.01,"ETH purchased",12282501,"ETH","INR","BUY"],
["2021-10-15 19:26:03",713.501,0.00,7360.28,10.29,18.36,"BNS purchased",1341540,"BNS","INR","BUY"],
["2021-10-15 19:25:26",9.8003,0.00,100.9,10.27,0.26,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",1.9581,0.00,20.16,10.27,0.06,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",19.9927,0.00,205.84,10.27,0.52,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",1.4681,0.00,15.12,10.27,0.04,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",8,0.00,82.37,10.27,0.21,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",8.0001,0.00,82.37,10.27,0.21,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",10,0.00,102.96,10.27,0.26,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",28,0.00,288.28,10.27,0.72,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",139.165,0.00,1432.8,10.27,3.58,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-15 19:25:26",37.8039,0.00,389.22,10.27,0.98,"BNS purchased",1341535,"BNS","INR","BUY"],
["2021-10-13 02:57:35",5336488,0.00,0,0.00,1.95,"SAFEMOON purchased",465663,"SAFEMOON","INR","BUY"],
["2021-10-13 02:59:05",275,0.56,4852.1,17.60,12.10,"DOGE purchased",8467470,"DOGE","INR","BUY"],
["2021-10-13 02:52:45",17074212,0.00,0,0.00,6.24,"SAFEMOON purchased",465653,"SAFEMOON","INR","BUY"],
["2021-10-13 02:52:13",8684,0.00,8183.37,0.94,20.30,"CVT purchased",376290,"CVT","INR","BUY"],
["2021-10-13 02:46:39",5.68,8479.32,8479.32,1496.58,21.26,"CAKE sold",3582400,"CAKE","INR","SELL"],
["2021-10-13 02:46:11",5.22,7792.61,7792.61,1496.58,19.54,"CAKE sold",3582399,"CAKE","INR","SELL"],
["2021-10-08 18:25:25",3.13,1.53,11.64,3.71,0.03,"QKC purchased",361968,"QKC","INR","BUY"],
["2021-10-08 18:24:26",30,0.00,575.94,19.15,1.44,"DOGE purchased",8362067,"DOGE","INR","BUY"],
["2021-10-08 18:22:50",0.00023613,0.00,999.98,4224330.14,2.50,"BTC purchased",12336946,"BTC","INR","BUY"],
["2021-10-08 18:22:37",0.0036,0.00,1005.78,278685.48,2.51,"ETH purchased",11946204,"ETH","INR","BUY"],
["2021-10-08 18:19:31",1466843,2504.96,2504.96,0.00,6.28,"SHIB sold",3882619,"SHIB","INR","SELL"],
["2021-10-08 18:19:23",52347,89.39,89.39,0.00,0.23,"SHIB sold",3882619,"SHIB","INR","SELL"],
["2021-10-08 16:33:34",1685.7107,1921.72,1921.72,1.14,0.00,"RAGE sold",47048,"RAGE","INR","SELL"],
["2021-10-08 16:24:20",7000,7980.00,7980.00,1.14,0.00,"RAGE sold",47048,"RAGE","INR","SELL"],
["2021-10-08 16:24:08",2615.7329,2981.94,2981.94,1.14,0.00,"RAGE sold",47048,"RAGE","INR","SELL"],
["2021-10-08 11:00:25",2168.649,20355.97,20355.97,9.41,51.02,"BNS sold",1315855,"BNS","INR","SELL"],
["2021-10-08 11:00:20",500,0.00,9448.56,18.85,23.57,"DOGE purchased",8355574,"DOGE","INR","BUY"],
["2021-10-08 03:17:26",9.5413,10.98,10.98,1.15,0.00,"RAGE sold",46943,"RAGE","INR","SELL"],
["2021-10-08 03:16:50",3689.0152,4242.37,4242.37,1.15,0.00,"RAGE sold",46943,"RAGE","INR","SELL"],
["2021-10-08 02:34:03",5009.8891,5711.28,5711.28,1.14,0.00,"RAGE sold",46942,"RAGE","INR","SELL"],
["2021-10-07 17:27:55",1507313,0.00,0,0.00,9.23,"SHIB purchased",3822631,"SHIB","INR","BUY"],
["2021-10-07 17:28:03",195,3712.66,3712.66,19.09,9.31,"DOGE sold",8331424,"DOGE","INR","SELL"],
["2021-10-07 17:25:40",11877,0.00,0,0.00,0.08,"SHIB purchased",3822539,"SHIB","INR","BUY"],
["2021-10-06 02:31:30",195,4.10,4027.04,20.60,10.05,"DOGE purchased",8250598,"DOGE","INR","BUY"],
["2021-10-06 02:31:05",195,5.86,4040.73,20.67,10.08,"DOGE purchased",8250478,"DOGE","INR","BUY"],
["2021-10-01 18:20:22",88.69,8016.55,8016.55,90.62,20.10,"MATIC sold",5898616,"MATIC","INR","SELL"],
["2021-09-28 20:32:21",350,5582.50,5582.50,15.99,14.00,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 20:31:49",129,2057.55,2057.55,15.99,5.16,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 20:29:31",6,95.70,95.70,15.99,0.24,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 20:26:58",4,63.80,63.80,15.99,0.16,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 20:15:18",250,3987.50,3987.50,15.99,10.00,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 20:09:31",1,15.95,15.95,15.99,0.04,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 19:45:54",10,159.50,159.50,15.99,0.40,"DOGE sold",8069208,"DOGE","INR","SELL"],
["2021-09-28 19:39:18",84,1333.09,1333.09,15.91,3.35,"DOGE sold",8069175,"DOGE","INR","SELL"],
["2021-09-28 19:39:18",166,2634.45,2634.45,15.91,6.61,"DOGE sold",8069175,"DOGE","INR","SELL"],
["2021-09-25 22:28:47",516,8459.25,8459.25,16.44,21.21,"DOGE sold",7983454,"DOGE","INR","SELL"],
["2021-09-25 22:23:52",88.69,0.00,7968.27,89.62,19.87,"MATIC purchased",5768832,"MATIC","INR","BUY"],
["2021-09-25 22:24:14",484,7967.97,7967.97,16.50,19.97,"DOGE sold",7983285,"DOGE","INR","SELL"],
["2021-09-24 05:08:27",562.8124,4480.02,4480.02,7.98,11.23,"BNS sold",1264635,"BNS","INR","SELL"],
["2021-09-23 08:34:36",65.2669,499.99,499.99,7.68,1.26,"BNS sold",1260544,"BNS","INR","SELL"],
["2021-09-21 04:19:54",2498.6545,0.00,19287.74,7.70,48.10,"BNS purchased",1250998,"BNS","INR","BUY"],
["2021-09-21 04:16:55",17599.138,0.00,42167.09,2.39,105.16,"RAGE purchased",38580,"RAGE","INR","BUY"],
["2021-09-21 04:15:33",669.8061,0.00,1504.12,2.24,3.76,"RAGE purchased",38543,"RAGE","INR","BUY"],
["2021-09-21 04:05:18",240.9475,0.00,386.48,1.60,0.97,"RAGE purchased",38429,"RAGE","INR","BUY"],
["2021-09-21 04:05:18",2289.9976,0.00,3673.16,1.60,9.16,"RAGE purchased",38429,"RAGE","INR","BUY"],
["2021-09-21 04:05:17",388.299,0.00,2981.81,7.66,7.44,"BNS purchased",1250924,"BNS","INR","BUY"],
["2021-09-16 01:53:34",0.0794,989.55,989.55,12494.10,2.49,"SOL sold",6303402,"SOL","INR","SELL"],
["2021-09-16 01:52:02",0.614,7652.20,7652.20,12494.10,19.18,"SOL sold",6303402,"SOL","INR","SELL"],
["2021-09-14 22:01:26",129,2422.35,2422.35,18.83,6.08,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 21:57:33",13,244.11,244.11,18.83,0.62,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 21:56:29",159,2985.69,2985.69,18.83,7.49,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 21:54:23",10,187.77,187.77,18.83,0.48,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 20:49:06",11,206.56,206.56,18.83,0.52,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 20:45:40",29,544.56,544.56,18.83,1.37,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-14 20:45:16",215,4037.26,4037.26,18.83,10.12,"DOGE sold",7651828,"DOGE","INR","SELL"],
["2021-09-12 00:39:50",0.6934,0.00,10162.41,14619.36,25.35,"SOL purchased",6075517,"SOL","INR","BUY"],
["2021-09-10 11:15:19",95.028,0.00,765.94,8.04,1.92,"BNS purchased",1206470,"BNS","INR","BUY"],
["2021-09-10 10:45:17",100,0.00,806.01,8.04,2.01,"BNS purchased",1206470,"BNS","INR","BUY"],
["2021-09-10 10:45:17",100,0.00,806.01,8.04,2.01,"BNS purchased",1206470,"BNS","INR","BUY"],
["2021-09-10 10:44:40",100,0.00,806.01,8.04,2.01,"BNS purchased",1206470,"BNS","INR","BUY"],
["2021-09-10 10:44:36",100,0.00,806.01,8.04,2.01,"BNS purchased",1206470,"BNS","INR","BUY"],
["2021-09-10 03:39:24",139.2578,0.00,1112.66,7.97,2.78,"BNS purchased",1205687,"BNS","INR","BUY"],
["2021-09-10 03:37:25",20,0.00,32628.97,1627.38,81.37,"CAKE purchased",3042584,"CAKE","INR","BUY"],
["2021-09-10 03:30:18",1785,2850.64,2850.64,1.60,7.15,"BNSD sold",337988,"BNSD","INR","SELL"],
["2021-09-10 03:29:39",100,159.80,159.80,1.60,0.41,"BNSD sold",337985,"BNSD","INR","SELL"],
["2021-09-10 03:29:39",100,159.80,159.80,1.60,0.41,"BNSD sold",337985,"BNSD","INR","SELL"],
["2021-09-10 03:29:39",100,159.80,159.80,1.60,0.41,"BNSD sold",337985,"BNSD","INR","SELL"],
["2021-09-10 03:29:39",5149,8228.07,8228.07,1.60,20.63,"BNSD sold",337985,"BNSD","INR","SELL"],
["2021-09-10 03:29:31",6045,9949.31,9949.31,1.65,24.94,"BNSD sold",337984,"BNSD","INR","SELL"],
["2021-09-10 03:27:30",100,159.80,159.80,1.60,0.41,"BNSD sold",337976,"BNSD","INR","SELL"],
["2021-09-10 03:27:26",50,80.29,80.29,1.61,0.21,"BNSD sold",337975,"BNSD","INR","SELL"],
["2021-09-10 03:27:26",200,321.19,321.19,1.61,0.81,"BNSD sold",337975,"BNSD","INR","SELL"],
["2021-09-10 03:27:26",500,802.98,802.98,1.61,2.02,"BNSD sold",337975,"BNSD","INR","SELL"],
["2021-09-10 03:27:26",50,80.29,80.29,1.61,0.21,"BNSD sold",337975,"BNSD","INR","SELL"],
["2021-09-10 03:27:09",38,61.06,61.06,1.61,0.16,"BNSD sold",337973,"BNSD","INR","SELL"],
["2021-09-10 03:27:01",309,496.86,496.86,1.61,1.25,"BNSD sold",337972,"BNSD","INR","SELL"],
["2021-09-10 03:26:53",100,161.59,161.59,1.62,0.41,"BNSD sold",337970,"BNSD","INR","SELL"],
["2021-09-10 03:26:33",3023,4975.48,4975.48,1.65,12.47,"BNSD sold",337969,"BNSD","INR","SELL"],
["2021-09-10 03:26:33",100,164.58,164.58,1.65,0.42,"BNSD sold",337969,"BNSD","INR","SELL"],
["2021-09-10 03:26:25",500,827.92,827.92,1.66,2.08,"BNSD sold",337968,"BNSD","INR","SELL"],
["2021-09-10 03:26:17",516,875.00,875.00,1.70,2.20,"BNSD sold",337967,"BNSD","INR","SELL"],
["2021-09-10 03:26:17",50,84.78,84.78,1.70,0.22,"BNSD sold",337967,"BNSD","INR","SELL"],
["2021-09-10 03:26:17",21,35.61,35.61,1.70,0.09,"BNSD sold",337967,"BNSD","INR","SELL"],
["2021-09-10 03:26:08",1612,2735.16,2735.16,1.70,6.86,"BNSD sold",337966,"BNSD","INR","SELL"],
["2021-09-10 03:26:00",88,149.40,149.40,1.70,0.38,"BNSD sold",337965,"BNSD","INR","SELL"],
["2021-09-09 02:18:48",0.00114701,5.08,4205.16,3657046.97,10.49,"BTC purchased",11539485,"BTC","INR","BUY"],
["2021-09-09 00:22:57",14110,0.00,24046.97,1.70,59.97,"BNSD purchased",337333,"BNSD","INR","BUY"],
["2021-09-09 00:12:05",2948,0.00,5024.13,1.70,12.53,"BNSD purchased",337333,"BNSD","INR","BUY"],
["2021-09-09 00:11:37",359,0.00,611.83,1.70,1.53,"BNSD purchased",337333,"BNSD","INR","BUY"],
["2021-09-09 00:01:45",3119,0.00,5315.56,1.70,13.26,"BNSD purchased",337333,"BNSD","INR","BUY"],
["2021-09-08 23:54:00",2000,39223.69,39223.69,19.66,98.31,"DOGE sold",7483955,"DOGE","INR","SELL"],
["2021-08-29 20:25:38",0.0267,0.00,6671.28,249237.55,16.64,"ETH purchased",10544246,"ETH","INR","BUY"],
["2021-08-29 20:23:34",9.0292,0.00,81.92,9.05,0.21,"BNS purchased",1165631,"BNS","INR","BUY"],
["2021-08-29 20:23:25",0.00397509,0.00,15000.62,3764244.91,37.41,"BTC purchased",11312463,"BTC","INR","BUY"],
["2021-08-29 20:22:41",455,0.00,9989.41,21.90,24.92,"DOGE purchased",7184653,"DOGE","INR","BUY"],
["2021-08-29 20:20:40",0.01330101,0.00,3314.04,248535.84,8.27,"ETH purchased",10544193,"ETH","INR","BUY"],
["2021-08-26 11:57:14",732,16.14,16863.41,22.98,42.05,"DOGE purchased",7081697,"DOGE","INR","BUY"],
["2021-08-26 11:54:55",9.5991,0.00,92.96,9.66,0.24,"BNS purchased",1155970,"BNS","INR","BUY"],
["2021-08-26 11:54:13",2467,0.00,56388.22,22.80,140.62,"DOGE purchased",7081624,"DOGE","INR","BUY"],
["2021-08-26 11:50:34",21.1591,0.00,204.91,9.66,0.52,"BNS purchased",1155965,"BNS","INR","BUY"],
["2021-08-26 11:51:20",717,0.00,16388.47,22.80,40.87,"DOGE purchased",7081579,"DOGE","INR","BUY"],
["2021-08-19 04:40:42",0.002,0.00,481.33,240065.20,1.21,"ETH purchased",10273288,"ETH","INR","BUY"],
["2021-08-19 04:34:56",3.952,0.00,38.47,9.71,0.10,"BNS purchased",1127344,"BNS","INR","BUY"],
["2021-08-19 04:34:47",0.0394,0.00,9482.22,240065.20,23.65,"ETH purchased",10273288,"ETH","INR","BUY"],
["2021-08-16 21:26:06",0.0012,0.00,303.48,252266.93,0.76,"ETH purchased",10194219,"ETH","INR","BUY"],
["2021-08-16 21:25:17",0.0067,0.00,1694.41,252266.93,4.23,"ETH purchased",10194219,"ETH","INR","BUY"],
["2021-07-03 03:52:09",10.8,0.00,14.62,1.35,0.04,"QKC purchased",344903,"QKC","INR","BUY"],
["2021-07-03 00:18:02",195,0.00,3655.62,18.70,9.12,"DOGE purchased",5142165,"DOGE","INR","BUY"],
["2021-07-03 00:15:57",1000,0.00,1373.43,1.37,3.43,"QKC purchased",344819,"QKC","INR","BUY"],
["2021-07-03 00:13:33",5.4349,28.78,28.78,5.31,0.08,"BNS sold",923049,"BNS","INR","SELL"],
["2021-05-11 05:25:20",908,0.00,35090.91,38.55,87.51,"DOGE purchased",1816381,"DOGE","INR","BUY"],
["2021-05-11 02:41:30",400,16159.50,16159.50,40.50,40.50,"DOGE sold",1803536,"DOGE","INR","SELL"],
["2021-05-11 02:41:30",468,18929.95,18929.95,40.55,47.45,"DOGE sold",1803541,"DOGE","INR","SELL"],
["2021-05-10 08:08:31",868,0.00,38983.62,44.80,97.22,"DOGE purchased",1721940,"DOGE","INR","BUY"]
    ];
    let csvContent = "data:text/csv;charset=utf-8," 
                        + "Time,Crypto_Amt,INR,FIAT,Rate,Fee,Desc,Reference,Coin,Market,SIDE\n"
                        + rows.map(row => row.join(",")).join("\n");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_data.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link); // Required for FF

  }

  resetAll = () => {
    localStorage.setItem(LOCAL_DATA,null);
    this.setState(emptyState)
  }

  updateSelectedCoinInState = (selectedCoinPrice) => {
    var selectedCoinName = this.state.selectedCoinToken;
    var selectedCoinDataSet = this.getCoinDataFromReport(selectedCoinName);
    var defaultResp = Object.assign({},defaultCoinObject);
    var selectedCoinData = selectedCoinDataSet.reduce(this.getCoinDataAnalyzer(selectedCoinPrice),defaultResp);
    
    this.setState({selectedCoinPrice , selectedCoinDataSet , selectedCoinData })

  }

  handleNewTokenSelection = (selectedCoinToken) => {
    this.setState( { selectedCoinToken })
    this.fetchSelectedCoinIdFromCoinGecko();
  }

  render(){
    return (
      <div className="App">
           <AppBar position="static">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
              >
                {/* <MenuIcon /> */}
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                { this.state.postProcessingDone ? "Detail" : "Upload your file"}
              </Typography>

                <Button variant="text" onClick={this.downloadSampleCSV} color="inherit">Download Sample Report</Button>

                { this.state.postProcessingDone ? 
                    <Button variant="outlined" onClick={this.resetAll} color="inherit">Reset</Button>
                    : <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
                          <Button variant="outlined" color="inherit" >Upload</Button>
                      </ReactFileReader>
                }

              
            </Toolbar>
          </AppBar>
          {
            !this.state.postProcessingDone
              ? <header className="App-header"> 
                  {/* <img src={logo} height="100px" width="100px" className="App-logo" alt="logo" /> */}
                  <label>In Deapth Analysis of Trade Report</label>
                </header> 
              : 
              <div>
                <PortfolioOverview
                  allCoinData = {this.state.allCoinData}
                  allCoins = {this.state.allSuportedCoins}
                />
                <PortfolioDetails
                  selectedCoinToken = { this.state.selectedCoinToken }
                  selectedCoinPrice = { this.state.selectedCoinPrice}
                  selectedCoinData = { this.state.selectedCoinData}
                  selectedCoinDataSet = { this.state.selectedCoinDataSet}
                  selectedCoinHistoricPrice = { this.state.selectedCoinHistoricPrice }
                  updateSelectedToken = {this.handleNewTokenSelection}
                  allSuportedCoins = {this.state.allSuportedCoins} />
              </div>
              
          }
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={this.state.showLoader}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
      </div>
    );
  }
}

export default App;
