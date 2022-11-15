
import Web3         from 'web3';
import { Contract } from "web3-eth-contract";
import erc20_abi    from '../../abis/_erc20.json';

import default_icon from '../../static/pics/coins/_default.svg';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type ERC20ContractPropsType = {
	web3                : Web3,
	store               : any,
	contractAddress     : string,
	contractType        : string,
	userAddress         : string,
	whitelistContract?  : Contract,
	delayedParams?      : boolean,
}
export type ERC20ContractParamsType = {
	address          : string,
	name             : string,
	symbol           : string,
	decimals         : number | undefined,
	icon             : string,
	balance          : BigNumber,
	allowance        : BigNumber,
	permissions      : {
		enabledForCollateral        : boolean,
		enabledForFee               : boolean,
		enabledRemoveFromCollateral : boolean,
	}
}

export const getERC20CollateralTokenFromStore = ( erc20CollateralTokens: Array<ERC20ContractParamsType>, techToken: ERC20ContractParamsType, address: string ): ERC20ContractParamsType | undefined => {
	const output = undefined;

	if ( techToken.address.toLowerCase() === address.toLowerCase() ) { return techToken; }

	const foundToken = erc20CollateralTokens.filter( (item: ERC20ContractParamsType) => { return item.address.toLowerCase() === address.toLowerCase() } );
	if ( foundToken.length ) {
		return foundToken[0];
	}

	return output;
}

export default class ERC20Contract {

	web3                : Web3;
	store               : any;
	contractAddress     : string;
	contractType        : string;
	userAddress         : string;
	contract            : Contract;
	erc20Params!        : ERC20ContractParamsType;
	wrapperAddress?     : string;
	whitelistContract?  : Contract;

	constructor(props: ERC20ContractPropsType) {
		this.web3                 = props.web3;
		this.store                = props.store;
		this.contractAddress      = props.contractAddress;
		this.contractType         = props.contractType;
		this.userAddress          = props.userAddress;
		this.whitelistContract    = props.whitelistContract;

		this.contract = new this.web3.eth.Contract(erc20_abi as any, this.contractAddress);
		// console.log('erc20', this.contract);
		if ( !props.delayedParams ) {
			this.getParams();
			this.addCheckoutEventListener();
		}
	}

	async getParams() {
		const name              = await this.contract.methods.name().call();
		const symbol            = await this.contract.methods.symbol().call();
		const decimals          = await this.contract.methods.decimals().call();
		const balance           = new BigNumber(await this.contract.methods.balanceOf(this.userAddress).call());
		let allowance           = new BigNumber(0);

		let icon = default_icon;
		try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.jpeg`              ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.jpg`               ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.png`               ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.svg`               ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${this.contractAddress.toLowerCase()}.jpeg`).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${this.contractAddress.toLowerCase()}.jpg` ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${this.contractAddress.toLowerCase()}.png` ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${this.contractAddress.toLowerCase()}.svg` ).default } catch (ignored) {}

		let permissions = {
			enabledForCollateral       : false,
			enabledForFee              : false,
			enabledRemoveFromCollateral: false,
		}
		if ( this.whitelistContract ) {
			permissions = {
				enabledForCollateral       : await this.whitelistContract.methods.enabledForCollateral(this.contractAddress).call(),
				enabledForFee              : await this.whitelistContract.methods.enabledForFee(this.contractAddress).call(),
				enabledRemoveFromCollateral: await this.whitelistContract.methods.enabledRemoveFromCollateral(this.contractAddress).call(),
			}
		}

		this.erc20Params = {
			address: this.contractAddress,
			name,
			symbol,
			decimals,
			icon,
			balance,
			allowance,
			permissions,
		}
	}
	addCheckoutEventListener() {
		this.contract.events.Approval(
			{
				fromBlock: 'earliest',
				filter: { owner: this.userAddress }
			},
			(e: any, data: any) => {
				this.getBalance();
			}
		);
		this.contract.events.Transfer(
			{
				fromBlock: 'earliest',
				filter: { from: this.userAddress }
			},
			(e: any, data: any) => {
				this.getBalance();
			}
		);
		this.contract.events.Transfer(
			{
				fromBlock: 'earliest',
				filter: { to: this.userAddress }
			},
			(e: any, data: any) => {
				this.getBalance();
			}
		);
	}

	async getBalance(address?: string) {
		if ( !this.erc20Params || !this.erc20Params.address ) {
			return {
				balance: new BigNumber(0),
				allowance: new BigNumber(0),
			}
		}
		const balance   = new BigNumber(await this.contract.methods.balanceOf(this.userAddress).call());
		let   allowance = new BigNumber(0);
		if ( address ) {
			allowance   = new BigNumber(await this.contract.methods.allowance(this.userAddress, address).call());
		}

		this.erc20Params = {
			...this.erc20Params,
			balance,
			allowance,
		}

		return {
			balance,
			allowance
		}
	}

	async makeAllowance(amount: BigNumber, addressTo: string) {
		const parsedAmount = new BigNumber(amount).toString() === '-1' ? new BigNumber(10**50).toString() : new BigNumber(amount).toString();
		const result = await this.contract.methods.approve(addressTo, parsedAmount).send({ from: this.userAddress });
		return result;
	}

}