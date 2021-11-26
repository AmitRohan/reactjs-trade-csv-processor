import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';
import React, { Component } from 'react';
import CurrentCoinBalance from './components/CurrentCoinBalance';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioDetails from './components/PortfolioDetails';
import { Button } from '@mui/material';
const CSVPasrse = require('csv-parse');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const defaultCoinObject = {
  coinsOwned : 0,
  currentValue : 0,
  fee : 0,
  moneyInvested : 0,
  moneyInvestedWithFees : 0
};

class App extends Component {
  postProcessingCheckpointCounter = 0;
  constructor(props) {
    super(props);
    this.state = {
      fileUploaded: false,
      postProcessingDone : false,
      postProcessingCheckpoints : 0,
      fileData : [],
      allCoinData : [],
      allCoinCoinGeckoId : [],
      allCoinPrice : [],
      allSuportedCoins : [],
      selectedCoinData : defaultCoinObject,
      selectedCoinDataSet : [],
      selectedCoinPrice : -1,
      selectedCoinToken : ""
    }
  }
  handleFiles = files => {

    // Set Checkpoint Size
    this.postProcessingCheckpointCounter = 0;
    var postProcessingCheckpoints = 999999;
    this.setState({ postProcessingCheckpoints , postProcessingDone : true});

    var reader = new FileReader();
    reader.onload = (e) => {
        // Use reader.result
        CSVPasrse(reader.result, {columns: true, trim: true}, (err,fileData) => {

          this.setState({ fileUploaded: true, postProcessingCheckpoints : 0});

          var allSuportedCoins = 
                        this.getAllCoinsFromReport(fileData)
                          .filter( coin =>{
                              // return ( -1 != ["BTC","ETH","DOGE"].indexOf(coin))
                              return ( -1 != ["BTC","ETH"].indexOf(coin))
                          });
          this.setState( { allSuportedCoins , fileData })
          // this.updateLatestCoinPricesFromCoinGecko();

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

  analyzeCoinData = (prevTransaction,currentTransaction) => {
    var newRecord = prevTransaction;
    if(currentTransaction.SIDE==='BUY'){
      newRecord.coinsOwned += parseFloat(currentTransaction.Crypto_Amt)
      newRecord.moneyInvested -= ((parseFloat(currentTransaction.Crypto_Amt)*100000000) * (parseFloat(currentTransaction.Rate)*100000000))
      newRecord.moneyInvested /= 10000000000000000
      newRecord.moneyInvestedWithFees -= parseFloat(currentTransaction.FIAT)
    }else{
      newRecord.coinsOwned -= parseFloat(currentTransaction.Crypto_Amt)
      newRecord.moneyInvested += ((parseFloat(currentTransaction.Crypto_Amt)*100000000) * (parseFloat(currentTransaction.Rate)*100000000))
      newRecord.moneyInvested /= 10000000000000000
      newRecord.moneyInvestedWithFees += parseFloat(currentTransaction.FIAT)
    }
    
    newRecord.fee += parseFloat(currentTransaction.Fee)
    newRecord.currentValue = (newRecord.coinsOwned * this.state.selectedCoinPrice)
    if(newRecord.currentValue !== 0)
      newRecord.currentValue -= newRecord.fee

    return newRecord  
  }
  
  postProcessingCheckpoints = 0;
  
  // var coinSymbol = coinResp.symbol.toLowerCase();

  // Updates coin price at indes in state
  fetchCoinDataUsingId = (cb) => {
    var index = this.postProcessingCheckpointCounter
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
          var coinData = coinDataSet.reduce(this.analyzeCoinData,defaultResp);
          
          var allCoinData = this.state.allCoinData;
          allCoinData[index] = coinData
          this.setState({ allCoinData })


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
              return (-1 != this.state.allSuportedCoins.indexOf(coinResp.symbol.toUpperCase()))
            });
            // Set Checkpoint Size
            this.postProcessingCheckpointCounter = 0;
            var postProcessingCheckpoints = suportedResponse.length;
            this.setState({ postProcessingCheckpoints });
            
            var allCoinCoinGeckoId = this.state.allCoinCoinGeckoId;
            suportedResponse.map( coinResp => {
                var coinSymbol = coinResp.symbol.toLowerCase();
                var indexInSuportedCoins = this.state.allSuportedCoins.indexOf(coinSymbol.toUpperCase())
                allCoinCoinGeckoId[indexInSuportedCoins] = coinResp.id
            })
            this.setState({ allCoinCoinGeckoId });
            var toRepeat = () => {
              if(postProcessingCheckpoints <= this.postProcessingCheckpointCounter
                  && !this.state.postProcessingDone){
                this.setState({ postProcessingDone : true})
                return;
              }
              this.fetchCoinDataUsingId(() => { 
                this.postProcessingCheckpointCounter++;
                toRepeat();
              })
            }
            toRepeat();


    })
  }

  fetchLatestDataFromCoinGecko = () => {
    CoinGeckoClient
        .coins
        .list()
        .then(resp => {
            if(resp.code !== 200){
                return;
            }
            resp.data.map( coinResp => {
                var coinSymbol = coinResp.symbol.toLowerCase();
                if(coinSymbol === this.state.selectedCoinToken.toLowerCase()){
                    
                    // Get Data
                    console.log("Fetching Latest Coin Data");
                    CoinGeckoClient.coins.fetch(coinResp.id, {})
                        .then(coinDataReponse => {
                            console.log("Latest Coin Data Fetched");
                            var selectedCoinName = this.state.selectedCoinToken;
                            // const selectedCoinPrice = 1
                            const selectedCoinPrice = coinDataReponse.data.market_data.current_price.inr
                            var selectedCoinDataSet = this.getCoinDataFromReport(selectedCoinName);
                            var defaultResp = Object.assign({},defaultCoinObject);
                            var selectedCoinData = selectedCoinDataSet.reduce(this.analyzeCoinData,defaultResp);
                            this.setState({ selectedCoinPrice })
                            this.setState({selectedCoinDataSet , selectedCoinData })
                            console.log("selectedCoinName", selectedCoinName, selectedCoinDataSet);
                        });
                    console.log("Fetching Historic Prices");
                    CoinGeckoClient.coins.fetchMarketChart(coinResp.id, {days : 91, vs_currency : 'inr' , interval : 'daily '})
                      .then(coinMarketChartData => {
                          console.log("Historic Prices Fetched");
                          const historicPrices = coinMarketChartData
                                                      .data
                                                      .prices
                                                      .filter((x,i)=> i > 61) // save last 5 entry as interval field is not supported yet
                                                      .map(x => { return Math.round(x[1]*10)/10}); // get abs value of price, 2nd param, 1st is timestamp
                          
                      });
            }
        })
    })
  }

  // UI EVENTS

  handleNewTokenSelection = (selectedCoinToken) => {
    this.setState( { selectedCoinToken })
    this.fetchLatestDataFromCoinGecko();
  }

  render(){
    return (
      <div className="App">
        
          {
            !this.state.postProcessingDone
              ? <header className="App-header"> 
                  <img src={logo} height="100px" width="100px" className="App-logo" alt="logo" />
                  <label>Upload Report</label>
                  <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
                      <Button variant="outlined">Upload</Button>
                  </ReactFileReader>
                </header> 
              : 
              <div>
                {/* <PortfolioOverview
                  allCoinData = {this.state.allCoinData}
                  allCoins = {this.state.allSuportedCoins}
                /> */}
                <PortfolioDetails
                  selectedCoinToken = { this.state.selectedCoinToken }
                  selectedCoinPrice = { this.state.selectedCoinPrice}
                  selectedCoinData = { this.state.selectedCoinData}
                  updateSelectedToken = {this.handleNewTokenSelection}
                  allSuportedCoins = {this.state.allSuportedCoins} />
              </div>
          }
      </div>
    );
  }
}

export default App;
