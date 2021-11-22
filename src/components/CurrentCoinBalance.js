import React, { Component } from 'react';

class CurrentCoinBalance extends Component {
  

  constructor(props) {
    super(props);
    
  }
  
  render(){
    return (
      <div>
        <header>
            <div>
              <h5>Coins Token</h5>
              <p>{this.props.coinToken}</p>
            </div>
            <div>
              <h5>Coins Owned</h5>
              <p>{this.props.coinData.coinsOwned}</p>
            </div>
            <div>
              <h5>Coin Price</h5>
              <p>{this.props.coinPrice}</p>
            </div>
            
            <div>
              <h5>Current Value</h5>
              <p>{this.props.coinData.currentValue}</p>
            </div>
            <div>
              <h5>Fees Paid</h5>
              <p>{this.props.coinData.fee}</p>
            </div>
            <div>
              <h5>Money Invested (Without fee)</h5>
              <p>{this.props.coinData.moneyInvested}</p>
            </div>
            <div>
              <h5>Money Invested (With fee)</h5>
              <p>{this.props.coinData.moneyInvestedWithFees}</p>
            </div>
        </header>
      </div>
    );
  }
}

export default CurrentCoinBalance;
