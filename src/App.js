import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';
import React, { Component } from 'react';
import CurrentCoinBalance from './components/CurrentCoinBalance';
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
  constructor(props) {
    super(props);
    this.state = {
      fileUploaded: false,
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
    var reader = new FileReader();
    reader.onload = (e) => {
        // Use reader.result
        CSVPasrse(reader.result, {columns: true, trim: true}, (err,allCoinData) => {

          this.setState({ fileUploaded: true});

          var allSuportedCoins = this.getAllCoinsFromReport(allCoinData);
          this.setState( { allSuportedCoins , allCoinData })
          this.updateLatestCoinPricesFromCoinGecko();

          var selectedCoinToken = "ETH"
          this.setState( { selectedCoinToken })
          this.fetchLatestDataFromCoinGecko();
          
        }) 
    }
    reader.readAsText(files[0]);
  }

  getCoinDataFromReport = (selectedCoinToken) => {
    return this.state.allCoinData.filter( row => (row.Coin.toLowerCase() === selectedCoinToken.toLowerCase()));
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
  

  
  // var coinSymbol = coinResp.symbol.toLowerCase();

  // Updates coin price at indes in state
  fetchCoinDataUsingId = (index) => {
    CoinGeckoClient
      .coins
      .fetch(this.state.allCoinCoinGeckoId[index], {})
      .then(coinDataReponse => {
          const coinPrice = coinDataReponse.data.market_data.current_price.inr
          var allCoinPrice = this.state.allCoinPrice;
          allCoinPrice[index] = coinPrice
          this.setState({ allCoinPrice })     
          console.log(this.state);
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
            resp.data.map( coinResp => {
                var coinSymbol = coinResp.symbol.toLowerCase();
                var indexInSuportedCoins = this.state.allSuportedCoins.indexOf(coinSymbol)
                if(indexInSuportedCoins != -1){
                  
                  var allCoinCoinGeckoId = this.state.allCoinCoinGeckoId;
                  allCoinCoinGeckoId[indexInSuportedCoins] = coinResp.idk
                  this.setState({ allCoinCoinGeckoId });

                  this.fetchCoinDataUsingId(indexInSuportedCoins)
                }
          
        })
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
                            const selectedCoinPrice = coinDataReponse.data.market_data.current_price.inr
                            var selectedCoinDataSet = this.getCoinDataFromReport(selectedCoinName);
                            var selectedCoinData = selectedCoinDataSet.reduce(this.analyzeCoinData,defaultCoinObject);
                            this.setState({ selectedCoinPrice })
                            this.setState({selectedCoinDataSet , selectedCoinData })
                                    
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

  handleApiKey = (evt) => {
    this.setState({
      apiKey: evt.target.value
    });
  }

  handleApiSecretKey = (evt) => {
    this.setState({
      apiSecretKey: evt.target.value
    });
  }

  onFetchDataButtonClick = (evt) => {
    console.log(this.state.apiKey,this.state.apiSecretKey);
  }

  render(){
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} height="100px" width="100px" className="App-logo" alt="logo" />
          <label>Upload Report</label>
          <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
              <button className='btn'>Upload</button>
          </ReactFileReader>
          {
            this.state.selectedCoinData !== defaultCoinObject
              ? <div> </div>
              : (<CurrentCoinBalance
                coinToken = {this.state.selectedCoinToken}
                coinPrice = {this.state.selectedCoinPrice}
                coinData = {this.state.selectedCoinData}
              />)
          }
        </header>

        
      </div>
    );
  }
}

export default App;
