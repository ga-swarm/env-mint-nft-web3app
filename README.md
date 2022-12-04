## Envelop Mint Web3APP
Web3 React application for mint NFT with save metadata to SWARM storage.  
This application code used in **production environment**, available at https://appv1.envelop.is/mint/  
NFT Minting available on Goerli, Ethereum, BSC and Polygon networks

### Dev build & debug with docker
!!!! Before run scripts from below please **rename** `.env.example` to `.env.local` !!!!

```bash
docker run -it --rm  -v $PWD:/app node:16 /bin/bash -c 'cd /app && yarn && chmod -R 777 node_modules'
```
```bash
docker run -it --rm  -v $PWD:/app -p 3008:3008  node:16 /bin/bash -c 'cd /app && yarn start'
```
After running the docker commands the web app can available at - http://localhost:3008/mint and NFTs can be minted there.

### Project settings  
Main Web3 settings such as smart contract address are in the [config.json](./src/config.json)
