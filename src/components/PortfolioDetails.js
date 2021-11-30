import { Tab, Tabs , Box, Avatar} from '@mui/material';
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
      var avatarIcon = <Avatar alt="" src={this.props.allCoinIcon[pos].small}  sx={{ width: 24, height: 24 }}/>
      return (
        <Tab icon={avatarIcon} iconPosition="start" label={coin} key={coin} />)
    });
  }

  render(){
    return (
      <div>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' , bgcolor: 'background.paper'}}>
          <Tabs value={this.state.coinIndex} aria-label="suported eth coin"  onChange={this.handleCoinSelection}>
            {
              this.getTabs()
            }
          </Tabs>
        </Box>
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
      </div>
    );
  }
}

export default PortfolioDetails;
