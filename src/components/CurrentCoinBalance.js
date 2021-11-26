import { Card, CardContent, Typography } from '@mui/material';
import React, { Component } from 'react';

class CurrentCoinBalance extends Component {
  
  render(){
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {this.props.coinData.coinsOwned + " " + this.props.coinToken + " Owned"} 
          </Typography>
          <Typography gutterBottom variant="h6" component="div">
            Price
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.props.coinPrice}
          </Typography>

          <Typography gutterBottom variant="h6" component="div">
            Current Value
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.props.coinData.currentValue}
          </Typography>

          <Typography gutterBottom variant="h6" component="div">
            Money Invested (Without fee)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.props.coinData.moneyInvested}
          </Typography>


          <Typography gutterBottom variant="h6" component="div">
            Fees Paid
          </Typography>
          <Typography variant="body2" color="text.secondary">
          {this.props.coinData.fee}
          </Typography>


          <Typography gutterBottom variant="h6" component="div">
            Money Invested (With fee)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.props.coinData.moneyInvestedWithFees}
          </Typography>


        </CardContent>
      </Card>
    );
  }
}

export default CurrentCoinBalance;