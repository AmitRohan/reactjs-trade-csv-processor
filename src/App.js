import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';
import React, { Component } from 'react';
const CSVPasrse = require('csv-parse');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultObj: "Default Content",
      apiKey: "",
      apiSecretKey  : ""
    }
  }
  handleFiles = files => {
    this.setState({ resultObj: ""});
    var reader = new FileReader();
    reader.onload = (e) => {
        // Use reader.result
        CSVPasrse(reader.result, {columns: true, trim: true}, (err,jsonObj) => {
          this.fetchLatestDataFromCoinGecko("ETH",jsonObj);
        }) 
    }
    reader.readAsText(files[0]);
  }

  getCoinDataFromReport = (key,report) => {
    return report.filter( row => (row.Coin.toLowerCase() === key.toLowerCase()));
  }
  cryptoTradeProcessor = (coinName,inrPrice,fileData) => {
    var coinData = this.getCoinDataFromReport(coinName,fileData);
    var processedData = this.processDataList(coinData,inrPrice);

    var output = "\n\n";
    output += "\n======================================================================"; 
    output += "\n\t" + coinName + " trade result"; 
    output += "\n======================================================================"; 
    output += "\n\nCoins Owned : " + processedData.coinBal + " " + coinName; 
    output += "\nCurrent Value : " + Math.abs(processedData.value) + " INR";
    output += "\n\nTotal Fees Paid : " + processedData.fee + " INR";
    output += "\nMoney Invested (Without fee) : " + Math.abs(processedData.money) + " INR";
    output += "\nMoney Invested (With fee) : " + Math.abs(processedData.fiat) + " INR";
    output += "\n======================================================================";        
    this.setState({ resultObj: output});

  }
  supportedCoins = [
      "ETH",
      "BTC",
      "QKC",
      "DOGE",
      "SHIB",
      "SAFEMOON",
      "XRP"
  ];

  fetchLatestDataFromCoinGecko = (coinName,jsonObj) => {
    CoinGeckoClient
        .coins
        .list()
        .then(resp => {
            if(resp.code !== 200){
                return;
            }
            resp.data.map( coinResp => {
                if(coinResp.symbol === coinName.toLowerCase()){
                    
                    // Get Data
                    console.log("Fetching Latest Coin Data");
                    CoinGeckoClient.coins.fetch(coinResp.id, {})
                        .then(coinDataReponse => {
                            console.log("Latest Coin Data Fetched");
                            const inrPrice = coinDataReponse.data.market_data.current_price.inr
                            
							console.log("Fetching Historic Prices");
							CoinGeckoClient.coins.fetchMarketChart(coinResp.id, {days : 91, vs_currency : 'inr' , interval : 'daily '})
                                .then(coinMarketChartData => {
                                    console.log("Historic Prices Fetched");
                                    const historicPrices = coinMarketChartData
                                                                .data
                                                                .prices
                                                                .filter((x,i)=> i > 61) // save last 5 entry as interval field is not supported yet
                                                                .map(x => { return Math.round(x[1]*10)/10}); // get abs value of price, 2nd param, 1st is timestamp
                                    
                                    var charOutputs = `\n ${coinResp.symbol} Day Wise Chart\t Current Price ${inrPrice} INR`;
                                    charOutputs += "\n======================================"; 
                                    charOutputs += "\n======================================"; 
                                    console.log(charOutputs)
                                    

                                    console.log("Processing Report");
                                    this.cryptoTradeProcessor(coinResp.symbol,inrPrice,jsonObj)

                                });

                                
                        });
            }
        })
    })
  }
  processDataList = (dataset,inrPrice) => {
    return dataset.reduce((prev,current,curretIndex) => {
        var _new = prev;
        if(current.SIDE==='BUY'){
            _new.coinBal += parseFloat(current.Crypto_Amt)
            _new.money -= ((parseFloat(current.Crypto_Amt)*100000000) * (parseFloat(current.Rate)*100000000))
      _new.money /= 10000000000000000
            _new.fiat -= parseFloat(current.FIAT)
        }else{
            _new.coinBal -= parseFloat(current.Crypto_Amt)
            _new.money += ((parseFloat(current.Crypto_Amt)*100000000) * (parseFloat(current.Rate)*100000000))
      _new.money /= 10000000000000000
            _new.fiat += parseFloat(current.FIAT)
        }
        
        _new.fee += parseFloat(current.Fee)
        _new.value = (_new.coinBal * inrPrice)
        if(_new.value !== 0)
            _new.value -= _new.fee

        return _new  
    },{
        fee : 0,
        coinBal : 0,
        money : 0,
        fiat : 0,
        value : 0,
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
          <img src={logo} className="App-logo" alt="logo" />
          <a
            className="App-link"
            href="https://www.linkedin.com/in/amit-rohan-250727a3/"
            target="_blank"
            rel="noopener noreferrer"
          >
          <div> Result </div>
          <div> { this.state.resultObj }</div>
            Follow on linkedin
          </a>
          <label>Api Key:</label>
          <input type="text" value={this.state.apiKey} onChange={this.handleApiKey}></input>
          <label>Api Secret Key:</label>
          <input type="text" value={this.state.apiSecretKey} onChange={this.handleApiSecretKey}></input>
          <button className='btn' onClick={this.onFetchDataButtonClick}>FEtCH</button>

          <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
              <button className='btn'>Upload</button>
          </ReactFileReader>
        </header>
      </div>
    );
  }
}

export default App;
