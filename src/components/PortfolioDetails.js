import { Tab, Tabs , Box } from '@mui/material';
import React, { Component } from 'react';
import CoinTab from './CoinTab';
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
      firstSelect : false,
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

    this.setState({ firstSelect : true , active : coin, coinIndex})
    this.props.updateSelectedToken(coin);
    
  }

  getTabs = () =>  {
    var allSuportedCoins = this.props.allSuportedCoins
    
    return allSuportedCoins.map( (coin,pos) => {
      var _card  = (  <CoinTab
        coinIcon = { this.props.allCoinIcon[pos]}
        coinToken = { coin}
        coinData = { this.props.allCoinData[pos] }/>)
      return (
        <Tab icon={_card} iconPosition="start" key={coin}/>)
    });
  }

  render(){
    return (
      <Box>
          <Tabs 
            value={this.state.coinIndex}
            aria-label="suported eth coin"
            onChange={this.handleCoinSelection}
            scrollButtons={true}
            allowScrollButtonsMobile
            selectionFollowsFocus
            sx={{ borderBottom: 1, borderColor: 'divider' , bgcolor: 'background.paper'}}>
            {
              this.getTabs()
            }
          </Tabs>
        {
            this.props.selectedCoinToken === null
            || !this.state.firstSelect
              ? <div> Select a token </div>
              : (<CurrentCoinBalance
                  coinToken = {this.props.selectedCoinToken}
                  coinPrice = {this.props.selectedCoinPrice}
                  coinData = {this.props.selectedCoinData}
                  coinIcon = {this.props.selectedCoinIcon}
                  coinDataSet = {this.props.selectedCoinDataSet}
                  coinHistoricPrice = {this.props.selectedCoinHistoricPrice}
                />)
        }
      </Box>
    );
  }
}

export default PortfolioDetails;
