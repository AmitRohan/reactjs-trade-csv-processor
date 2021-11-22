import React, { Component } from 'react';
import CoinOverview from './CoinOverview';

class PortfolioOverview extends Component {
  

  constructor(props) {
    super(props);
    
  }

  getIndividualCards = () =>  {
    var allCoinData = this.props.allCoinData
    return allCoinData.map( (coin, id) => {
      return (<CoinOverview
                key= { id}
                coinToken = { this.props.allCoins[id]}
                coinData = { coin }
            />)
    });
  }
  
  render(){
    return (
      <div>
        <h4>Portfolio Overview</h4>
        {
          this.getIndividualCards()
        }
      </div>
    );
  }
}

export default PortfolioOverview;
