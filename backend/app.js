require('dotenv').config();
const express = require('express')
const app = express()
const port = 3001

// gRPC imports
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");

const path = require('path');

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

app.get("/generate-invoice/:source/:price", function (req, res) {
  let request = { 
    value: req.params['price'],
    memo: req.params['source']
  };
  client.addInvoice(request, function(err, response) {
    res.json(response);
  });
});

app.get("/check-invoice/:payment_hash", function (req, res) {
  let request = { 
    r_hash_str: req.params['payment_hash'],
    // r_hash: btoa(req.params['payment_request'])
  };
  client.lookupInvoice(request, function(err, response) {
    if (err) {
      console.log('Error: ' + err);
    }
    res.json(response);
    }
  );
});

app.get('/file/:source', function (req, res, next) { // show image after use has paid invoice

  var options = {
    // root: path.join(__dirname, 'static'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  var fileName = path.join(path.join(__dirname, 'static'))
  res.download(path.join(__dirname, 'static', req.params['source']), req.params['source'], options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})