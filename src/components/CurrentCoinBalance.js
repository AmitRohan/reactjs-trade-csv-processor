import { Avatar, Card, CardContent, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import React, { Component } from 'react';
import ReactApexChart from "react-apexcharts";


const chartConfig = {
  series: [],
  options: {
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Last 90 price',
      align: 'left'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        opacity: 0.5
      },
    },
    xaxis: {
      categories: [],
    }
  },
};

class CurrentCoinBalance extends Component {

  getOverViewCard = () => {
    return(
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
          {Math.abs(this.props.coinData.currentValue)}
        </Typography>

        <Typography gutterBottom variant="h6" component="div">
          Money Invested (Without fee)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.abs(this.props.coinData.moneyInvested)}
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
          {Math.abs(this.props.coinData.moneyInvestedWithFees)}
        </Typography>
      </CardContent>
    </Card>
    )
  }
  
  getGraph = () => {
    const coinHistoricPrice = this.props.coinHistoricPrice || []
    const options = Object.assign({},chartConfig.options)
    options.xaxis.categories= coinHistoricPrice.map( x => new Date(x[0]).toLocaleDateString())
    const series = [{
      name: this.props.coinToken,
      data: coinHistoricPrice.map( x => x[1])
  }]
    return (
      <ReactApexChart options={options} series={series} type="line" height={350} />
    )
  }

  getHistoricGraphCard = () => {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
        {
          this.getGraph()
        }
        </CardContent>
      </Card>)
  }

  getTransactionListCard = () => {

    var borderProps = { borderBottom: 1 , borderColor : 'divider'};
    var lastBorderProps = { };

    return (<Card sx={{ minWidth: 275 }}>
      <CardContent>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {
              this.props.coinDataSet.map( (transaction, pos) => {
                
                var secondaryComp = 
                  (<React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      align="right"
                      color="text.primary"
                    >
                      {transaction.Time}
                    </Typography>
                    
                  </React.Fragment>)
                
                return(
                  <ListItem key={pos + "transaction"} sx={ pos + 1 === this.props.coinDataSet.length ? lastBorderProps : borderProps}>
                  
                      <ListItemIcon>
                        {/* {
                          transaction.SIDE === "BUY" ? <AddIcon /> : <RemoveIcon />
                        } */}

                        <Avatar alt="Remy Sharp" src={this.props.coinIcon.large} />

                        
                      </ListItemIcon>
                      <ListItemText
                        primary={ transaction.Crypto_Amt + " " + transaction.Desc + " for " + transaction.FIAT}
                        secondary={secondaryComp}
                      />
                    

                  </ListItem>
                )
              })
            }
          </List>
      </CardContent>
    </Card>)
  }

  render(){
    return (
      <Grid container spacing={2} sx={{ padding: '12px' , paddintTop : '0px'}}>
          <Grid item xs={8}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {
                  this.getOverViewCard()
                }
              </Grid>
              <Grid item xs={12}>
                {
                  this.getHistoricGraphCard()
                }
              </Grid>
            </Grid>
          </Grid>          
          <Grid item xs={4}>
              {
                this.getTransactionListCard()
              }
          </Grid>
        </Grid>
    );
  }
}

export default CurrentCoinBalance;