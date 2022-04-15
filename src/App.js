import React, { useState } from "react";
import './App.css';


const backend_url = "http://3.101.23.89:3000/";

function App() {
  const [input, setInput] = useState("");
  const [id, setId] = useState("");
  const [proof, setProof] = useState("");

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const submitInput = (event) => {
    if (input !== "") {
      fetch(backend_url + "generate_proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{\"in\":" + input + "}",
      })
        .then((response) => response.json())
        .then((data) => {
          setId(data.id);
        })
        .catch((error) => alert("Fetch error: Check if your input is formatted currectly."));
    }
  }

  const submitHash = (event) => {
    if (id !== "") {
      fetch(backend_url + "result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{\"id\":\"" + id + "\"}",
      })
        .then((response) => response.json())
        .then((data) => {
          setProof(JSON.stringify(data));
        });
    }
  }

  const copyProof = (event) => {
    if (proof !== "") {
      navigator.clipboard.writeText(proof);
    }
  }

  return (
    <>
    <div className="App">
      <header className="App-header">
        <h1>ZK x ZK</h1>
        <div>
          <input placeholder="BinSub circuit input" className="App-input" type="text" value={input} onChange={handleInputChange}/>
          <button onClick={submitInput} className="App-button">Submit Verification Job</button>
        </div>
        <div className="App-div">
          {id === "" ? <div/> : 
          <div className="App-div">
            <div>Your job ID is {id}. Generating the proof may take a few minutes...</div>
            <button onClick={submitHash} className="App-button">Check if proof is ready</button>
          </div>}
        </div>
        <div className="App-div">
          {proof === "" ? "": proof.substring(0, Math.min(proof.length, 48)) + "..."}
          {proof === "" ? "" : <button onClick={copyProof} className="App-button">Copy proof to clipboard</button>}
        </div>
      </header>
    </div>
    </>
  );
}

export default App;