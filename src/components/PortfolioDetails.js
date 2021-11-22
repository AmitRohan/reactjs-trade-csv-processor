import React, { Component } from 'react';
import styled from 'styled-components';
import CurrentCoinBalance from './CurrentCoinBalance';

const defaultCoinObject = {
  coinsOwned : 0,
  currentValue : 0,
  fee : 0,
  moneyInvested : 0,
  moneyInvestedWithFees : 0
};


const Tab = styled.button`
  font-size: 20px;
  padding: 10px 60px;
  cursor: pointer;
  opacity: 0.6;
  background: white;
  border: 0;
  outline: 0;
  ${({ active }) =>
    active &&
    `
    border-bottom: 2px solid black;
    opacity: 1;
  `}
`;
const ButtonGroup = styled.div`
  display: flex;
`;

class PortfolioDetails extends Component {

  constructor(props) {
    super(props);
    this.state = {
      active : "",
      selectedCoinData : defaultCoinObject,
      selectedCoinDataSet : [],
      selectedCoinPrice : -1,
    } 
  }
  getTabs = () =>  {
    var allSuportedCoins = this.props.allSuportedCoins
    return allSuportedCoins.map( coin => {
      return (<Tab
                key={coin}
                active={this.state.active === coin}
                onClick={() => { 
                  if(this.state.active === coin){
                    return;
                  }
                  this.props.updateSelectedToken(coin);
                  this.setState({ active : coin})
                  console.log(this.props);
                }}
              >
                {coin}
              </Tab>)
    });
  }

  render(){
    return (
      <div>
        <h4>Coin Details</h4>
        <ButtonGroup>
          {
            this.getTabs()
          }
        </ButtonGroup>
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
