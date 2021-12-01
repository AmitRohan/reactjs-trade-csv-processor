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

    var coin = this.props.pState.allSuportedCoins[coinIndex] || "";

    if(this.state.active === coin){
      return;
    }

    this.setState({ firstSelect : true , active : coin, coinIndex})
    this.props.updateSelectedToken(coin);
    
  }

  getTabs = () =>  {
    var allSuportedCoins = this.props.pState.allSuportedCoins
    
    return allSuportedCoins.map( (coin,pos) => {
      var _coin = {
        coinToken : coin,
        coinData : this.props.pState.allCoinData[pos],
        coinIcon : this.props.pState.allCoinIcon[pos],
      }
      var _tabCard  = (  <CoinTab coin = { _coin } />)
      return (
        <Tab icon={_tabCard} iconPosition="start" key={coin}/>)
    });
  }

  render(){
    var selectedCoinData = {
      coinToken : this.props.pState.selectedCoinToken,
      coinPrice : this.props.pState.selectedCoinPrice,
      coinData : this.props.pState.selectedCoinData,
      coinIcon : this.props.pState.selectedCoinIcon,
      coinDataSet : this.props.pState.selectedCoinDataSet,
      coinHistoricPrice : this.props.pState.selectedCoinHistoricPrice
    }
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
            this.props.pState.selectedCoinToken === null
            || !this.state.firstSelect
              ? <div> Select a token </div>
              : (<CurrentCoinBalance coin = {selectedCoinData}/>)
        }
      </Box>
    );
  }
}

export default PortfolioDetails;
