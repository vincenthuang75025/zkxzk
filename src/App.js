import React, { useState, useEffect } from "react";
import './App.css';
import { bigint_to_array, msg_hash } from "./bls.ts";

const backend_url = "http://54.153.52.193:3000/";

/* global BigInt */
function App() {
  const [pubkey, setPubkey] = useState({0: "", 1: ""});
  const [signature, setSignature] = useState({0: "", 1: "", 2: "", 3: ""});
  const [message, setMessage] = useState("");
  const [id, setId] = useState("");
  const [proof, setProof] = useState("");

  useEffect(() => {
    msg_hash("abc").then(res => console.log(res));
  }, []);

  const handlePubkeyChange = (index, event) => {
    setPubkey({...pubkey, [index]: event.target.value});
  }

  const handleSignatureChange = (index, event) => {
    setSignature({...signature, [index]: event.target.value});
  }

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const submitInput = (event) => {
    if (message === "" || pubkey[0] === "" || pubkey[1] === "" || signature[0] === "" || signature[1] === "" || signature[2] === "" || signature[3] === "") {
      alert("Please fill in all fields");
      return;
    }
    msg_hash(message).then(res => {
      // console.log(JSON.stringify({
      //   pubkey: [bigint_to_array(55, 7, BigInt(pubkey[0])), bigint_to_array(55, 7, BigInt(pubkey[1]))], 
      //   signature: [[bigint_to_array(55, 7, BigInt(signature[0])), bigint_to_array(55, 7, BigInt(signature[1]))], 
      //   [bigint_to_array(55, 7, BigInt(signature[2])), bigint_to_array(55, 7, BigInt(signature[3]))]],  
      //   hash: res
      // }));
      fetch(backend_url + "generate_proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pubkey: [bigint_to_array(55, 7, BigInt(pubkey[0])), bigint_to_array(55, 7, BigInt(pubkey[1]))], 
          signature: [[bigint_to_array(55, 7, BigInt(signature[0])), bigint_to_array(55, 7, BigInt(signature[1]))], 
          [bigint_to_array(55, 7, BigInt(signature[2])), bigint_to_array(55, 7, BigInt(signature[3]))]],  
          hash: res
        })
      })
      .then(res => res.json())
      .then(data => setId(data.id))
    })
    .catch(err => alert(err));
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
          <div className="App-row">
            <input type="text" className="App-input" placeholder="Pubkey (real part)" value={pubkey[0]} onChange={(e) => handlePubkeyChange(0, e)}/>
            <input type="text" className="App-input" placeholder="Pubkey (imag part)" value={pubkey[1]} onChange={(e) => handlePubkeyChange(1, e)}/>
          </div>
          <div className="App-row">
            <input type="text" className="App-input" placeholder="Signature (x, real part)" value={signature[0]} onChange={(e) => handleSignatureChange(0, e)}/>
            <input type="text" className="App-input" placeholder="Signature (x, imag part)" value={signature[1]} onChange={(e) => handleSignatureChange(1, e)}/>
            <input type="text" className="App-input" placeholder="Signature (y, real part)" value={signature[2]} onChange={(e) => handleSignatureChange(2, e)}/>
            <input type="text" className="App-input" placeholder="Signature (y, imag part)" value={signature[3]} onChange={(e) => handleSignatureChange(3, e)}/>
          </div>
          <div className="App-row">
           <input placeholder="Message" className="App-input" type="text" value={message} onChange={handleMessageChange}/>
           <button onClick={submitInput} className="App-button">Submit Verification Job</button>
          </div>
        </div>
        <div className="App-div">
          {id === "" ? <div/> : 
          <div className="App-div">
            <div>Your job ID is {id}. Generating the proof may take a few minutes...</div>
            <button onClick={submitHash} className="App-button">Check if proof is ready</button>
          </div>}
        </div>
        <div className="App-overflow">
          {proof === "" ? "": proof}
          {/* {proof === "" ? "" : <button onClick={copyProof} className="App-button">Copy proof to clipboard</button>} */}
        </div>
      </header>
    </div>
    </>
  );
}

export default App;