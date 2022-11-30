## Envelop Mint Web3APP
Web3 React application for mint NFT with save metadata to SWARM storage.  
This application code used in **production environment**, available at https://appv1.envelop.is/mint/  
NFT Minting available on Goerli, Ethereum, BSC and Polygon networks

### Dev build & debug with docker

```bash
docker run -it --rm  -v $PWD:/app node:16 /bin/bash -c 'cd /app && yarn && chmod -R 777 node_modules'
docker run -it --rm  -v $PWD:/app -p 3010:3010  node:16 /bin/bash -c 'cd /app && yarn start'
```

### Project settings  
Main Web3 settings such as smart contract address are in the [config.json](./src/config.json)
