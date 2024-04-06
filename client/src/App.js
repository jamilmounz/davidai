import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './App.css'; // Import custom styles
import Avatar from './nerd.webp';



function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  document.title = "David: Your AI Employee"; // Set the tab name

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const submitQuery = async () => {
    try {
      const res = await axios.post('http://localhost:4000/talk', { query });
      setResponse(res.data.message);
      setQuery('');
    } catch (error) {
      console.error('Error submitting query:', error);
      setResponse('Error communicating with the server.');
    }
  };

  return (
    <div className="App d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="mb-4">
          {/* AI Avatar as an image or div with background image */}
          <img src={Avatar} className="rounded-circle" alt="AI Avatar" style={{width: '200px', height: '200px'}} />
        </div>
        <input
          className="form-control form-control-lg mb-3"
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Ask David about an asset..."
          style={{maxWidth: '600px', margin: 'auto'}}
        />
        <button className="btn btn-primary btn-lg" onClick={submitQuery}>Submit</button>
        <div className="response-rectangle mt-3 p-3 text-start bg-light" style={{maxWidth: '600px', margin: '20px auto', borderRadius: '8px'}}>
          David: {response}
        </div>
      </div>
    </div>
  );
}

export default App;
