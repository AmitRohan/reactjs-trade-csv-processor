import { Avatar, Card, CardContent, Typography } from '@mui/material';
import React, { Component } from 'react';

// Boiler Plate for Using custom styles for Badge below icon
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';

const GreenStyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        content: '""',
      },
    }
}));



const RedStyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#b74400',
    color: '#b74400',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      content: '""',
    },
  }
}));


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
