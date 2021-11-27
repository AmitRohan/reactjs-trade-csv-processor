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
const clientEndAllowedCoins = ["ETH","BTC"];

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
  }
  handleFiles = files => {

    // Set Checkpoint Size
    this.postProcessingCheckpointCounter = 0;
    var postProcessingCheckpoints = 999999;
    this.setState({ postProcessingCheckpoints , postProcessingDone : false, showLoader : true});

    var reader = new FileReader();
    reader.onload = (e) => {
        // Use reader.result
        CSVPasrse(reader.result, {columns: true, trim: true}, (err,fileData) => {

          this.setState({ fileUploaded: true, postProcessingCheckpoints : 0, fileData});
          
          var coinDataAnalyzer = this.getCoinDataAnalyzer(0);
          var allSuportedCoins = this.getAllCoinsFromReport(fileData)
                          .filter( coinName => 
                            (this
                              .getCoinDataFromReport(coinName)
                              .reduce(coinDataAnalyzer,Object.assign({},defaultCoinObject))
                              .coinsOwned > 0)
                          ).filter( coin =>{
                              return ( -1 !== clientEndAllowedCoins.indexOf("ALL") || -1 !== clientEndAllowedCoins.indexOf(coin) )
                              // return ( -1 !== ["BTC","ETH"].indexOf(coin))
                          })
                          // Coins with Balane > 0
                          
          
                  

          
          this.setState( { allSuportedCoins })
          this.updateLatestCoinPricesFromCoinGecko();

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


    })
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
    }).catch(err => console.log(err));
  }

  fetchCoinPrice = (coinId) => {
    CoinGeckoClient
      .coins
      .fetch(coinId, {})
      .then(coinDataReponse => {
          // const selectedCoinPrice = 1
          const selectedCoinPrice = coinDataReponse.data.market_data.current_price.inr
          this.updateSelectedCoinInState(selectedCoinPrice);
      }).catch(err => console.log(err));
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
      }).catch(err => console.log(err));
  }

  // UI EVENTS

  resetAll = () => {
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
                { this.state.postProcessingDone ? 
                    <Button onClick={this.resetAll} color="inherit">Reset</Button>
                    : <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
                          <Button color="inherit" >Upload</Button>
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
