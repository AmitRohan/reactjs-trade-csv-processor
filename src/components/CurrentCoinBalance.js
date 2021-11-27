import { Card, CardContent, Typography } from '@mui/material';
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

          {
            this.getGraph()
          }

        </CardContent>
      </Card>
    );
  }
}

export default CurrentCoinBalance;