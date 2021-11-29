import { Grid} from '@mui/material';
import React, { Component } from 'react';
import CoinOverview from './CoinOverview';

class PortfolioOverview extends Component {

  getIndividualCards = () =>  {
    var allCoinData = this.props.allCoinData;
    return allCoinData.map( (coin, id) => {
      return (
        <Grid item xs={4} key= { id}>
            <CoinOverview
              coinIcon = { this.props.allCoinIcon[id]}
              coinToken = { this.props.allCoins[id]}
              coinData = { coin }/>
        </Grid>)
    });
  }
  
  render(){
    return (
      <Grid container spacing={2}>

        {
          this.getIndividualCards()
        }
        </Grid>
    );
  }
}

export default PortfolioOverview;
