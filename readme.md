# Lapp Marketplace

## Requirements
- Requires docker and docker compose
- Require polar

## Errors
- When getting `Error: Error: 14 UNAVAILABLE: No connection established` error, it means that you might not be getting the correct tls.cert and macaroon, host and port from lnd 
- `Docker Error connect ENOENT /var/run/docker.sock` Somehow Polar is unable to detect Docker in Apple chip Mac

## Resources
- for more info on lnd in node.js [click here](https://github.com/lightningnetwork/lnd/blob/master/docs/grpc/javascript.md)