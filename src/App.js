import logo from './logo.svg';
import './App.css';
import ReactFileReader from 'react-file-reader';


function App() {

  var handleFiles = files => {
    var reader = new FileReader();
    reader.onload = function(e) {
        // Use reader.result
        alert("rEAD")
        console.log(reader.result)
    }
    reader.readAsText(files[0]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://www.linkedin.com/in/amit-rohan-250727a3/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow on linkedin
        </a>
        <ReactFileReader handleFiles={handleFiles} fileTypes={'.csv'}>
            <button className='btn'>Upload</button>
        </ReactFileReader>
      </header>
    </div>
  );
}

export default App;
