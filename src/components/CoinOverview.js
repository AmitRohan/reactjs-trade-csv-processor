import { Card, CardContent, Typography } from '@mui/material';
import React, { Component } from 'react';

class CoinOverview extends Component {
  
  getProfit = () =>  {
    var profit = this.props.coinData.currentValue/this.props.coinData.moneyInvested
    profit *= 100;

    // Rounding Off
    profit *= 100;
    profit %= 100;
    profit = Math.round(profit);
    profit /= 100;
    return profit;
  }
  
  render(){
    return (

      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {this.props.coinToken } { this.getProfit() + "%" }
          </Typography>
          <Typography gutterBottom variant="h6" component="div">
            {Math.abs(this.props.coinData.currentValue)} INR
          </Typography>
          <p>Invested {Math.abs(this.props.coinData.moneyInvested)}</p>
        </CardContent>
      </Card>
    );
  }
}

export default CoinOverview;
