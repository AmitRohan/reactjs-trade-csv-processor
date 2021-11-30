import { Avatar, Card, CardContent, Typography } from '@mui/material';
import React, { Component } from 'react';
import GreenStyledBadge from './GreenStyledBadge';
import RedStyledBadge from './RedStyledBadge';

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

      <Card>
        <CardContent>

          { this.getProfit() > 0
            ?  <GreenStyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar alt="Remy Sharp" src={this.props.coinIcon.large} /> 
              </GreenStyledBadge>
            : <RedStyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar alt="Remy Sharp" src={this.props.coinIcon.large} /> 
              </RedStyledBadge>
          }
          <Typography gutterBottom variant="h5" component="div">
            {this.props.coinToken } { this.getProfit() + "%" }
          </Typography>
          <Typography gutterBottom variant="h6" component="div">
            {Math.abs(this.props.coinData.currentValue)} INR
          </Typography>
        </CardContent>
      </Card>
    );
  }
}

export default CoinOverview;
