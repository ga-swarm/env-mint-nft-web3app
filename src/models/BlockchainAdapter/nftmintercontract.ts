
import Web3         from 'web3';
import { Contract } from "web3-eth-contract";

import MetamaskAdapter from './metamaskadapter';

import { getABI } from '../_utils';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type NftMinterPropsType = {
	web3               : Web3,
	metamaskAdapter    : MetamaskAdapter,
	store              : any,
	contract721Address : string,
	contract1155Address: string,
	userAddress        : string,
	t                  : any,
}

export default class NftMinterContract {

	web3               : Web3;
	metamaskAdapter    : MetamaskAdapter;
	store              : any;
	contract721Address : string;
	contract1155Address: string;
	userAddress        : string;
	contract721        : Contract;
	contract1155       : Contract;
	t                  : any;

	constructor(props: NftMinterPropsType) {
		this.web3                = props.web3;
		this.metamaskAdapter     = props.metamaskAdapter;
		this.store               = props.store;
		this.contract721Address  = props.contract721Address;
		this.contract1155Address = props.contract1155Address;
		this.userAddress         = props.userAddress;
		this.t                   = props.t;

		let nftMinter721ABI;
		try {
			nftMinter721ABI = getABI(this.metamaskAdapter.chainId || 0, this.contract721Address, 'nftminter721');
		} catch(e) {
			console.log(`Cannot load ${this.contract721Address} NFT minter 721 abi:`, e);
			throw new Error(`Cannot load NFT minter 721 abi`);
		}
		this.contract721 = new this.web3.eth.Contract(nftMinter721ABI, this.contract721Address);
		console.log('NFT minter 721', this.contract721);

		let nftMinter1155ABI;
		try {
			nftMinter1155ABI = getABI(this.metamaskAdapter.chainId || 0, this.contract1155Address, 'nftminter1155');
		} catch(e) {
			console.log(`Cannot load ${this.contract1155Address} NFT minter 1155 abi:`, e);
			throw new Error(`Cannot load NFT minter 1155 abi`);
		}
		this.contract1155 = new this.web3.eth.Contract(nftMinter1155ABI, this.contract1155Address);
		console.log('NFT minter 1155', this.contract1155);

	}

	async getContractName() {
		const output = await this.contract721.methods.name().call();
		return output;
	}

	async getTotalSupply1155() {
		let lastId = 0;
		let t = 0;
		while(true) {
			t++;
			const supply = await this.contract1155.methods.totalSupply(t).call();
			if(supply < 1) {
				lastId = t - 1;
				break;
			}
		}		
		return lastId;
	}

	async getTotalSupply(params: {
		standart: number
	}) {
		let output = 0
		if ( params.standart === 721 ) {
			output = await this.contract721.methods.totalSupply().call();
		}
		else if ( params.standart === 1155 ) {
			output = await this.getTotalSupply1155();
		}
		return output;
	}

	async mintWithURI(params: {
		tokenId: number,
		tokenURI: string,
		batch: number,
		amount: number,
		standart: number,
		oracleSignature: string,
		userAddress: string
	}) {

		let tx = ( params.standart === 721 ) ? this.contract721.methods.mintWithURI(params.userAddress, params.tokenId, params.tokenURI, params.oracleSignature) : this.contract1155.methods.mintWithURI(params.userAddress, params.tokenId, params.amount, params.tokenURI, params.oracleSignature);

		if ( params.batch > 1 ) {
			// Prepare batch
			let addresses = [];
			let tokenIds = [];
			let tokenURIs = [];
			let amounts = [];
			let oracleSignature = params.oracleSignature;
			for ( let i = 0; i < params.batch; i++ ) {
				addresses.push(params.userAddress as any);
				tokenIds.push(params.tokenId++ as any);
				tokenURIs.push(params.tokenURI as any);
				amounts.push(params.amount as any);
			}
			let signatures = oracleSignature.split(';');
			tx = ( params.standart === 721 ) ? this.contract721.methods.mintWithURIBatch(addresses,tokenIds,tokenURIs,signatures) : this.contract1155.methods.mintWithURIBatch(addresses,tokenIds,amounts, tokenURIs,signatures);
		}

		let estimatedGas;
		let data;

		try {
			estimatedGas = await tx.estimateGas({ from: params.userAddress });
		} catch(e) {
			throw e;
		}

		if(this.metamaskAdapter.chainId === 5) {
			estimatedGas = new BigNumber(estimatedGas).plus(new BigNumber(100000)).toString();
		}

		data = tx.send({ from: params.userAddress, gas: estimatedGas });

		return data;
	}

}