import { Tab, Tabs , Box} from '@mui/material';
import React, { Component } from 'react';
import CurrentCoinBalance from './CurrentCoinBalance';

const defaultCoinObject = {
  coinsOwned : 0,
  currentValue : 0,
  fee : 0,
  moneyInvested : 0,
  moneyInvestedWithFees : 0
};

class PortfolioDetails extends Component {

  constructor(props) {
    super(props);
    this.state = {
      active : "",
      coinIndex : 0,
      selectedCoinData : defaultCoinObject,
      selectedCoinDataSet : [],
      selectedCoinPrice : -1,
    } 
  }

  handleCoinSelection = (e,coinIndex) => {
    
    var coin = this.props.allSuportedCoins[coinIndex] || "";

    if(this.state.active === coin){
      return;
    }
    this.setState({ active : coin, coinIndex})
    this.props.updateSelectedToken(coin);
    
  }

  getTabs = () =>  {
    var allSuportedCoins = this.props.allSuportedCoins
    return allSuportedCoins.map( coin => {
      return (<Tab label={coin} key={coin}/>)
    });
  }

  render(){
    return (
      <div>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={this.state.coinIndex} aria-label="suported eth coin"  onChange={this.handleCoinSelection}>
            {
              this.getTabs()
            }
          </Tabs>
        </Box>
        {
            this.props.selectedCoinToken === null
              ? <div> Select a token </div>
              : (<CurrentCoinBalance
                  coinToken = {this.props.selectedCoinToken}
                  coinPrice = {this.props.selectedCoinPrice}
                  coinData = {this.props.selectedCoinData}
                />)
        }
      </div>
    );
  }
}

export default PortfolioDetails;
