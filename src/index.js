import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Boiler Plate for Using custom styles for Badge below icon
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';

const boilerPlateCode = () => {
  

  const StyledBadge = styled(Badge)(({ theme }) => ({ }));


  // Start listening to the process
  var warningCheck =  (warning) => {
    
    // If there is a warning then print
    // it and stop the process
    if (warning) {
        console.log(warning);
    }
  };

  process.emitWarning = warningCheck;
}


boilerPlateCode();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
