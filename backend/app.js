require('dotenv').config();
const express = require('express')
const app = express()
const port = 3001

// gRPC imports
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

const packageDefinition = protoLoader.loadSync('lightning.proto', loaderOptions);

// Load lnd macaroon
let m = fs.readFileSync(process.env.MACAROON);
let macaroon = m.toString('hex');

// Build meta data credentials
let metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
let macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// Combine credentials
let lndCert = fs.readFileSync(process.env.TLS_CERT);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Create client
let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning(process.env.HOST + ':' + process.env.PORT, credentials);

//// ROUTES

app.get('/', (req, res) => {
  res.send('Kachow!')
})

app.get("/getinfo", function (req, res) {
  client.getInfo({}, function(err, response) {
    if (err) {
      console.log('Error: ' + err);
    }
    res.json(response);
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})