import { Grid} from '@mui/material';
import React, { Component } from 'react';
import CoinOverview from './CoinOverview';

class PortfolioOverview extends Component {

  getCombinedPortfolio = () => {
    var seedData = {
      coinsOwned : 0,
      currentValue : 0,
      fee : 0,
      moneyInvested : 0,
      moneyInvestedWithFees : 0
    };
    var combinedData = this.props.allCoinData.reduce( (prevTransaction,currentTransaction) => {
          var newRecord = Object.assign({},prevTransaction);
          newRecord.currentValue += currentTransaction.currentValue;
          newRecord.moneyInvested += currentTransaction.moneyInvested;
          newRecord.moneyInvestedWithFees += currentTransaction.moneyInvestedWithFees;
          newRecord.coinsOwned += currentTransaction.coinsOwned;
          newRecord.fee += currentTransaction.fee;
          return newRecord;
      },seedData);
    return (
      <Grid item xs={12}>
        <CoinOverview
          coinIcon = { { large : "" } }
          coinToken = { "OVER ALL" }
          coinData = { combinedData }/>
      </Grid>)
  }

  getIndividualCards = () =>  {
    var allCoinData = this.props.allCoinData;
    return allCoinData.map( (coin, id) => {
      return (
        <Grid item xs={3} key= {id}>
            <CoinOverview
              coinIcon = { this.props.allCoinIcon[id]}
              coinToken = { this.props.allCoins[id]}
              coinData = { coin }/>
        </Grid>)
    });
  }
  
  render(){
    return (
      <Grid container spacing={2} sx={{ padding: '12px'}}>
        {
          this.getCombinedPortfolio()
        }
        {
          this.getIndividualCards()
        }
      </Grid>
    );
  }
}

export default PortfolioOverview;
