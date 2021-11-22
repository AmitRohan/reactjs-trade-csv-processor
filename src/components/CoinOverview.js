import React, { Component } from 'react';

class CoinOverview extends Component {
  

  constructor(props) {
    super(props);
    
  }

  getProfit = () =>  {
    var profit = this.props.coinData.currentValue/this.props.coinData.moneyInvested
    profit *= 100;

    // Rounding Off
    profit *= 100;
    profit %= 100;
    profit /= 100;
    return profit;
  }
  
  render(){
    return (
      <div>
        <header>
            <div>
              </div>
            <div>
              <h5>{this.props.coinToken} Tokens</h5>
              <p>Owned {this.props.coinData.coinsOwned}</p>
              <p>Value {this.props.coinData.currentValue}</p>
              <p>Profit {this.getProfit()}</p>
              <p>Invested {this.props.coinData.moneyInvested}</p>
            </div>
        </header>
      </div>
    );
  }
}

export default CoinOverview;
