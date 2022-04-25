# ZK x ZK

This is the frontend for a demo that took place at DevConnect Amsterdam 2022. The demo can be found [here](http://zkxzk.xyz). We allow users to submit their public key, a BLS signature, and a message (represented as a point on the BLS12-381 curve); these inputs are submitted to a zk-SNARK which checks the validity of the signature. If valid, the server returns a proof to the user; if invalid, an error is displayed. 

The implementation of BLS signatures (which required implementation of elliptic curve pairings in Circom) can be found [here](https://github.com/yi-sun/circom-pairing/). The server setup can be found [here](https://github.com/vincenthuang75025/zk-node-server-c/).