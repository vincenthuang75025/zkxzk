import { PointG1, PointG2 } from "@noble/bls12-381";
import { ssz } from "@chainsafe/lodestar-types";
import React, { useState, useEffect } from "react";
import "./App.css";
import {
  bigint_to_array,
  formatHex,
  hexToBytes,
  utils,
  bytesToHex,
} from "./bls";
import { ReactComponent as Logo } from "./logo.svg";

const hashToField = utils.hashToField;

const backend_url = "https://api.zkxzk.xyz/";

/* global BigInt */
function App() {
  const [slot, setSlot] = useState("");
  const [epoch, setEpoch] = useState("");
  const [pubkeyHex, setPubkeyHex] = useState("");
  const [blockRoot, setBlockRoot] = useState("");
  const [signatureHex, setSignatureHex] = useState("");

  const [signingRoot, setSigningRoot] = useState("");
  const [pubkey, setPubkey] = useState({ 0: "", 1: "" });
  const [signature, setSignature] = useState({ 0: "", 1: "", 2: "", 3: "" });
  const [message, setMessage] = useState({ 0: "", 1: "", 2: "", 3: "" });
  const [id, setId] = useState("");
  const [inputJson, setInputJson] = useState("");
  const [publicJson, setPublicJson] = useState("");
  const [proof, setProof] = useState("");

  /*useEffect(() => {
    msg_hash("abc").then(res => console.log(res));
  }, []);*/

  const handlePubkeyChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPubkey({ ...pubkey, [index]: event.target.value });
  };

  const handleSignatureChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSignature({ ...signature, [index]: event.target.value });
  };

  const handleMessageChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMessage({ ...message, [index]: event.target.value });
  };

  async function submitSlot(event: any) {
    if (slot === "" || isNaN(Number(slot))) {
      alert("Please provide a valid slot number.");
      return;
    }
    try {
      let slotNum: number = Number(slot);
      let blockJson = await fetch(
        "https://beaconcha.in/api/v1/block/" + slotNum.toString()
      ).then((res) => {
        return res.json();
      });
      setBlockRoot(blockJson["data"]["blockroot"]);
      setEpoch(blockJson["data"]["epoch"]);
      setSignatureHex(blockJson["data"]["signature"]);
      let proposer: number = Number(blockJson["data"]["proposer"]);
      let validatorJson = await fetch(
        "https://beaconcha.in/api/v1/validator/" + proposer.toString()
      ).then((res) => {
        return res.json();
      });
      setPubkeyHex(validatorJson["data"]["pubkey"]);
    } catch {
      alert("API call to get block failed.");
    }
  }
  async function submitBlock(event: any) {
    if (
      epoch === "" ||
      pubkeyHex === "" ||
      blockRoot === "" ||
      signatureHex === ""
    ) {
      alert("Please fill in all fields");
      return;
    }
    try {
      let publicKey = PointG1.fromHex(formatHex(pubkeyHex));
      publicKey.assertValidity();
      let sig: PointG2 = PointG2.fromSignature(formatHex(signatureHex));
      sig.assertValidity();
      let root: Uint8Array = hexToBytes(blockRoot);

      // infura API call gives:
      const genesisValidatorsRoot: Uint8Array = hexToBytes(
        "0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95"
      );

      const ForkData = ssz.phase0.ForkData;
      let fork_data = ForkData.defaultValue();

      const ALTAIR_FORK_EPOCH: number = 74240;
      if (Number(epoch) < ALTAIR_FORK_EPOCH)
        fork_data.currentVersion = hexToBytes("0x00000000");
      else fork_data.currentVersion = hexToBytes("0x01000000"); // altair

      fork_data.genesisValidatorsRoot = genesisValidatorsRoot;
      let fork_data_root = ForkData.hashTreeRoot(fork_data);

      let domain = new Uint8Array(32);
      const DOMAIN_BEACON_PROPOSER = Uint8Array.from([0, 0, 0, 0]);
      for (let i = 0; i < 4; i++) domain[i] = DOMAIN_BEACON_PROPOSER[i];
      for (let i = 0; i < 28; i++) domain[i + 4] = fork_data_root[i];

      const SigningData = ssz.phase0.SigningData;
      let signing_data = SigningData.defaultValue();
      signing_data.objectRoot = hexToBytes(blockRoot);
      signing_data.domain = domain;
      let signing_root: Uint8Array = SigningData.hashTreeRoot(signing_data);

      setSigningRoot("0x" + bytesToHex(signing_root));
      let u: bigint[][] = await hashToField(signing_root, 2);

      setPubkey({
        0: "0x" + publicKey.toAffine()[0].value.toString(16),
        1: "0x" + publicKey.toAffine()[1].value.toString(16),
      });

      setSignature({
        0: "0x" + sig.toAffine()[0].c[0].value.toString(16),
        1: "0x" + sig.toAffine()[0].c[1].value.toString(16),
        2: "0x" + sig.toAffine()[1].c[0].value.toString(16),
        3: "0x" + sig.toAffine()[1].c[1].value.toString(16),
      });

      setMessage({
        0: "0x" + u[0][0].toString(16),
        1: "0x" + u[0][1].toString(16),
        2: "0x" + u[1][0].toString(16),
        3: "0x" + u[1][1].toString(16),
      });
    } catch {
      alert("Input values are not valid. Please try again.");
    }
  }

  const submitInput = (event: any) => {
    if (
      message[0] === "" ||
      message[1] === "" ||
      message[2] === "" ||
      message[3] === "" ||
      pubkey[0] === "" ||
      pubkey[1] === "" ||
      signature[0] === "" ||
      signature[1] === "" ||
      signature[2] === "" ||
      signature[3] === ""
    ) {
      alert("Please fill in all fields");
      return;
    }
    // console.log(JSON.stringify({
    //   pubkey: [bigint_to_array(55, 7, BigInt(pubkey[0])), bigint_to_array(55, 7, BigInt(pubkey[1]))],
    //   signature: [[bigint_to_array(55, 7, BigInt(signature[0])), bigint_to_array(55, 7, BigInt(signature[1]))],
    //   [bigint_to_array(55, 7, BigInt(signature[2])), bigint_to_array(55, 7, BigInt(signature[3]))]],
    //   hash: [[bigint_to_array(55, 7, BigInt(message[0])), bigint_to_array(55, 7, BigInt(message[1]))],
    //   [bigint_to_array(55, 7, BigInt(message[2])), bigint_to_array(55, 7, BigInt(message[3]))]]
    // }));
    let inputStr: string = JSON.stringify({
      pubkey: [
        bigint_to_array(55, 7, BigInt(pubkey[0])),
        bigint_to_array(55, 7, BigInt(pubkey[1])),
      ],
      signature: [
        [
          bigint_to_array(55, 7, BigInt(signature[0])),
          bigint_to_array(55, 7, BigInt(signature[1])),
        ],
        [
          bigint_to_array(55, 7, BigInt(signature[2])),
          bigint_to_array(55, 7, BigInt(signature[3])),
        ],
      ],
      hash: [
        [
          bigint_to_array(55, 7, BigInt(message[0])),
          bigint_to_array(55, 7, BigInt(message[1])),
        ],
        [
          bigint_to_array(55, 7, BigInt(message[2])),
          bigint_to_array(55, 7, BigInt(message[3])),
        ],
      ],
    });
    setInputJson(inputStr);
    setProof("");

    fetch(backend_url + "generate_proof", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: inputStr,
    })
      .then((res) => res.json())
      .then((data) => setId(data.id));
  };

  const submitHash = (event: any) => {
    if (id !== "") {
      fetch(backend_url + "result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: '{"id":"' + id + '"}',
      })
        .then((response) => response.json())
        .then((data) => {
          setProof(JSON.stringify(data));
        });
    }
  };

  const copyProof = (event: any) => {
    if (proof !== "") {
      navigator.clipboard.writeText(proof);
    }
  };

  return (
    <>
      <div className="App">
        <header className="App-header"></header>
        <h1>ZK x ZK</h1>
        <div className="container mt-2">
          <div className="card block-card">
            <div className="card-body px-0 py-1">
              <div className="row border-bottom p-3 mx-0">
                <div style={{ paddingRight: "15px", paddingLeft: "15px" }}>
                  Enter a slot from the Beacon Chain to autofill block
                  information from{" "}
                  <a href="https://beaconcha.in/blocks">beaconcha.in</a>:
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Slot: </span>
                </div>
                <div className="col-md-10">
                  <input
                    type="text"
                    className="App-input"
                    placeholder="Enter slot"
                    value={slot}
                    onChange={(e) => {
                      setSlot(e.currentTarget.value);
                    }}
                  />
                </div>
              </div>

              <div className="border-bottom">
                <div className="col-button">
                  <button onClick={submitSlot} className="App-button">
                    Autofill Block Information
                  </button>
                </div>
              </div>

              <div className="row border-bottom p-3 mx-0">
                <div style={{ paddingRight: "15px", paddingLeft: "15px" }}>
                  Enter the following information directly from a block:
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Epoch: </span>
                </div>
                <div className="col-md-10">
                  <input
                    type="text"
                    className="App-input"
                    placeholder="Enter epoch"
                    value={epoch}
                    onChange={(e) => {
                      setEpoch(e.currentTarget.value);
                    }}
                  />
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Proposer Public Key: </span>
                </div>
                <div className="col-md-10">
                  <input
                    type="text"
                    className="App-input"
                    placeholder="Enter proposer public key"
                    value={pubkeyHex}
                    onChange={(e) => {
                      setPubkeyHex(e.currentTarget.value);
                    }}
                  />
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Block Root: </span>
                </div>
                <div className="col-md-10">
                  <input
                    type="text"
                    className="App-input"
                    placeholder="Enter block root"
                    value={blockRoot}
                    onChange={(e) => {
                      setBlockRoot(e.currentTarget.value);
                    }}
                  />
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Signature: </span>
                </div>
                <div className="col-md-10">
                  <textarea
                    rows={2}
                    className="App-input"
                    placeholder="Enter proposer signature for the block"
                    value={signatureHex}
                    onChange={(e) => {
                      setSignatureHex(e.currentTarget.value);
                    }}
                  />
                </div>
              </div>

              <div className="border-bottom">
                <div className="col-button">
                  <button onClick={submitBlock} className="App-button">
                    Process Block Information
                  </button>
                </div>
              </div>

              {signingRoot === "" ? (
                <div />
              ) : (
                <div className="row border-bottom p-3 mx-0">
                  <div className="col-md-2">
                    <span>Signing Root: </span>
                  </div>
                  <div className="col-md-10">{signingRoot}</div>
                </div>
              )}
              <div className="row border-bottom p-3 mx-0">
                <div style={{ paddingRight: "15px", paddingLeft: "15px" }}>
                  Enter the following inputs for BLS signature verification:
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Public Key (G1 Point): </span>
                </div>
                <div className="col-md-10">
                  <div className="col-input">
                    x = &nbsp;
                    <input
                      type="text"
                      className="App-input"
                      placeholder="Pubkey (x)"
                      value={pubkey[0]}
                      onChange={(e) => handlePubkeyChange(0, e)}
                    />
                  </div>
                  <div className="col-input">
                    y = &nbsp;
                    <input
                      type="text"
                      className="App-input"
                      placeholder="Pubkey (y)"
                      value={pubkey[1]}
                      onChange={(e) => handlePubkeyChange(1, e)}
                    />
                  </div>
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>Signature (G2 Point): </span>
                </div>
                <div className="col-md-10">
                  <div className="col-input">
                    x = &nbsp;
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                      }}
                    >
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Signature (x, real part)"
                          value={signature[0]}
                          onChange={(e) => handleSignatureChange(0, e)}
                        />
                        &nbsp; +
                      </div>
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Signature (x, imag part)"
                          value={signature[1]}
                          onChange={(e) => handleSignatureChange(1, e)}
                        />
                        &nbsp; * I
                      </div>
                    </div>
                  </div>

                  <div className="col-input">
                    y = &nbsp;
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                      }}
                    >
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Signature (y, real part)"
                          value={signature[2]}
                          onChange={(e) => handleSignatureChange(2, e)}
                        />
                        &nbsp; +
                      </div>
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Signature (y, imag part)"
                          value={signature[3]}
                          onChange={(e) => handleSignatureChange(3, e)}
                        />
                        &nbsp; * I
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-2">
                  <span>hashToField(msg, 2): </span>
                </div>
                <div className="col-md-10">
                  <div className="col-input">
                    u[0] = &nbsp;
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                      }}
                    >
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Message (0, real part)"
                          value={message[0]}
                          onChange={(e) => handleMessageChange(0, e)}
                        />
                        &nbsp; +
                      </div>
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Message (0, imag part)"
                          value={message[1]}
                          onChange={(e) => handleMessageChange(1, e)}
                        />
                        &nbsp; * I
                      </div>
                    </div>
                  </div>

                  <div className="col-input">
                    u[1] = &nbsp;
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                      }}
                    >
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Message (1, real part)"
                          value={message[2]}
                          onChange={(e) => handleMessageChange(2, e)}
                        />
                        &nbsp; +
                      </div>
                      <div className="col-input">
                        <input
                          type="text"
                          className="App-input"
                          placeholder="Message (1, imag part)"
                          value={message[3]}
                          onChange={(e) => handleMessageChange(3, e)}
                        />
                        &nbsp; * I
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-bottom">
                <div className="col-button">
                  <button onClick={submitInput} className="App-button">
                    Submit Verification Job
                  </button>
                </div>
              </div>
            </div>
            {id === "" ? (
              <div />
            ) : (
              <>
                <div className="row border-bottom p-3 mx-0">
                  <div className="col-md-12">
                    <h5>input.json: </h5>
                    <div className="col-input">
                      <textarea
                        className="App-input"
                        rows={20}
                        value={inputJson}
                      />
                    </div>
                  </div>
                </div>
                <div className="row border-bottom p-3 mx-0">
                  <div className="col-md-12">
                    Your job ID is {id}. Generating the proof may take a few
                    minutes...
                  </div>
                </div>
                <div className="border-bottom">
                  <div className="col-button">
                    <button onClick={submitHash} className="App-button">
                      Check if proof is ready
                    </button>
                  </div>
                </div>
              </>
            )}
            {proof === "" ? (
              ""
            ) : (
              <div className="row border-bottom p-3 mx-0">
                <div className="col-md-12">
                  <h5>proof.json: </h5>
                  <div className="col-input">
                    <textarea className="App-input" rows={10} value={proof} />
                  </div>
                </div>
              </div>
            )}
            <div>
              {proof === "" ? (
                ""
              ) : (
                <button onClick={copyProof} className="App-button">
                  Copy proof to clipboard
                </button>
              )}
            </div>
          </div>
        </div>
        <a href="https://github.com/vincenthuang75025/zkxzk">
          <Logo fill="#ffffff" width="2rem" />
        </a>
      </div>
    </>
  );
}

export default App;
