
import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";
import config from '../../config.json';
import { Contract } from 'web3-eth-contract';
import NftMinterContract from './nftmintercontract';
import {
	ERC20Contract,
} from '.';

import {
	setError,
	resetAppData,

	metamaskConnectionSuccess,
	metamaskConnectionRejected,
	metamaskConnectionNotInstalled,
	metamaskSetChainParams,

	updateNativeBalance,

	metamaskSetAvailableChains,
	setAuthMethod,
	setLoading,
	unsetLoading,
	clearError,
	requestChain,
} from '../../reducers';

import default_icon from '../../static/pics/coins/_default.svg';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type MetamaskAdapterPropsType = {
	store: any,
	t    : any,
}
export type ChainParamsType = {
	chainId?                      : number | undefined,
	chainName                     : string,
	chainColorCode                : string,
	chainRPCUrl                   : string,
	networkTokenTicket            : string,
	EIPPrefix                     : string,
	networkTokenDecimals          : number | undefined,
	networkTokenIcon?             : string | undefined,
	isTestNetwork                 : Boolean;
	explorerBaseUrl               : string;
	explorerName                  : string;
	nftMinterContract721?         : string;
	nftMinterContract1155?        : string;
};

export default class MetamaskAdapter {

	store           : any;
	web3!           : Web3;
	wcProvider!     : any;
	availiableChains: Array<ChainParamsType>;
	chainId?        : number;
	chainConfig!    : ChainParamsType;
	userAddress!    : string;
	whitelistContract!: Contract;
	erc20CollateralTokens: Array<ERC20Contract>;
	unsubscribe     : () => {};
	chainChangeRequested: boolean;
	nftMinterContract?: NftMinterContract;

	t: any;

	accessAtempts   : number;

	constructor(props: MetamaskAdapterPropsType) {
		this.store = props.store;
		this.t = props.t;
		this.availiableChains = config.CHAIN_SPECIFIC_DATA;
		this.store.dispatch(metamaskSetAvailableChains(this.availiableChains));
		this.erc20CollateralTokens = [];
		this.chainChangeRequested = false;

		this.accessAtempts = 0;

		this.unsubscribe = this.store.subscribe(() => {
			if ( this.store.getState().metamaskAdapter.logged && !this.chainChangeRequested && this.store.getState().metamaskAdapter.requestChainId && this.chainId && this.store.getState().metamaskAdapter.requestChainId !== this.chainId ) {
				this.chainChangeRequested = true;
				this.store.dispatch(setError({
					text: `You are trying to open chain which does not match one selected in metamask`,
					buttons: [
						{
							text: this.t('Switch network'),
							clickFunc: () => {
								(window as any).ethereum.request({
									method: 'wallet_switchEthereumChain',
									params: [{ chainId: '0x' + Number(this.store.getState().metamaskAdapter.requestChainId).toString(16) }], // chainId must be in hexadecimal numbers
								})
							}
						},
						{
							text: this.t('Continue with current'),
							clickFunc: async () => {
								this.store.dispatch(requestChain( undefined ));
								this.chainChangeRequested = false;
								window.location.href = '/list';
								await this.getChainConfg();
								this.store.dispatch(clearError());
							}
						},
					],
					links: undefined
				}));
			}
		})
	}
	async connect() {
		const method = this.store.getState().metamaskAdapter.authMethod;

		this.store.dispatch(setLoading({ msg: this.t('Waiting for metamask login') }));
		if ( method === 'METAMASK' ) {
			try {
				if ( !(window as any).ethereum ) {
					// console.log((window as any).ethereum)
					this.store.dispatch(unsetLoading());
					this.store.dispatch(metamaskConnectionNotInstalled());
					this.store.dispatch(setError({
						text: this.t('No access to metamask'),
						buttons: [{
							text: this.t('Download extension or mobile app'),
							clickFunc: () => { window.open('https://metamask.io/download.html', "_blank"); }
						},
						{
							text: this.t('Close'),
							clickFunc: () => {
								window.location.href = '/';
								this.store.dispatch(clearError());
							}
						}],
						links: undefined
					}));
					return;
				} else {
					await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
				}
			} catch(e) {
				this.store.dispatch(unsetLoading());
				this.accessAtempts++;
				console.log('Cannot connect to metamask:', e);

				if ( this.accessAtempts < 3 ) {
					setTimeout(() => { this.connect() }, 100);
				} else {
					this.accessAtempts = 0;
					this.store.dispatch(setError({
						text: this.t('You should grant access in metamask'),
						buttons: [{
							text: this.t('Try again'),
							clickFunc: () => { this.connect(); this.store.dispatch(clearError()); }
						}],
						links: undefined
					}));
					this.store.dispatch(metamaskConnectionRejected());
					localStorage.removeItem('provider_type');
				}

				return;
			}

			try {
				this.web3 = new Web3( (window as any).ethereum );
				localStorage.setItem('provider_type', 'METAMASK');
			} catch(e: any) {
				this.store.dispatch(unsetLoading());
				this.store.dispatch(setError({
					text: this.t('Cannot connect to metamask'),
					buttons: [{
						text: this.t('Try again'),
						clickFunc: () => { this.connect() }
					}],
					links: undefined
				}));
				console.log(`Cannot connect to metamask: ${e.toString()}`);
				this.store.dispatch(metamaskConnectionRejected());
				localStorage.removeItem('provider_type');
			}

		}
		if ( method === 'WALLET_CONNECT' ) {
			const urls: any = {};
			this.availiableChains.forEach((item) => {
				if (!item.chainId) { return; }
				urls[item.chainId] = item.chainRPCUrl;
			});

			try {
				this.wcProvider = new WalletConnectProvider({
					rpc: urls,
				});
				await this.wcProvider.enable();
			} catch(e) {
				this.store.dispatch(unsetLoading());
				console.log('Cannot connect to wallet connect:', e);

				this.store.dispatch(setError({
					text: this.t('You should grant access in your wallet'),
					buttons: [{
						text: this.t('Try again'),
						clickFunc: () => {this.connect(); this.store.dispatch(clearError()); }
					},
					{
						text: this.t('Close'),
						clickFunc: () => { this.store.dispatch(clearError()); }
					}],
					links: undefined
				}));
				this.store.dispatch(metamaskConnectionRejected());
				localStorage.removeItem('provider_type');

				return;
			}
			try {
				this.web3 = new Web3( this.wcProvider );
				localStorage.setItem('provider_type', 'WALLET_CONNECT');
			} catch(e: any) {
				this.store.dispatch(unsetLoading());
				this.store.dispatch(setError({
					text: this.t('Cannot connect to walletconnect'),
					buttons: [{
						text: this.t('Try again'),
						clickFunc: () => { this.connect() }
					}],
					links: undefined
				}));
				localStorage.removeItem('provider_type');
				console.log(`Cannot connect to walletconnect: ${e.toString()}`);
				this.store.dispatch(metamaskConnectionRejected());
			}

		}

		console.log('web3', this.web3);
		const accounts = await this.web3.eth.getAccounts();
		this.userAddress = accounts[0];
		this.store.dispatch(metamaskConnectionSuccess({
			address: this.userAddress,
		}));
		await this.getChainId();
		this.store.dispatch(unsetLoading());
		this.fetchNativeBalance();
		this.updateChainListener(method);
	}
	async getChainId() {
		const chainId = await this.web3.eth.getChainId()
		this.chainId = chainId;
		await this.checkUrlChain();
	}
	async checkUrlChain() {
		if ( this.store.getState().metamaskAdapter.requestChainId && this.store.getState().metamaskAdapter.requestChainId !== this.chainId ) {
			this.store.dispatch(setError({
				text: `You are trying to open chain which does not match one selected in metamask`,
				buttons: [
					{
						text: this.t('Switch network'),
						clickFunc: () => {
							(window as any).ethereum.request({
								method: 'wallet_switchEthereumChain',
								params: [{ chainId: '0x' + Number(this.store.getState().metamaskAdapter.requestChainId).toString(16) }], // chainId must be in hexadecimal numbers
							})
						}
					},
					{
						text: this.t('Continue with current'),
						clickFunc: async () => {
							window.location.href = '/list';
							await this.getChainConfg();
							this.store.dispatch(clearError());
						}
					},
				],
				links: undefined
			}));
		} else {
			await this.getChainConfg();
		}
	}
	async getChainConfg() {

		let foundChain = this.availiableChains.filter((item: ChainParamsType) => { return item.chainId === this.chainId });
		if ( !foundChain.length ) {
			const chosenAuthMethod = this.store.getState().metamaskAdapter.authMethod;
			this.store.dispatch(resetAppData());
			this.store.dispatch(setAuthMethod(chosenAuthMethod));
			localStorage.removeItem('walletconnect');
			const availableChainsStr = this.availiableChains.map((item) => { return item.isTestNetwork ? `${item.chainName} (testnet)` : item.chainName }).join(', ');
			this.store.dispatch(setError({
				text: `${this.t('Unsupported chain. Please choose from')}: ${ availableChainsStr }`,
				buttons: [{
					text: this.t('Connect again'),
					clickFunc: () => { this.connect() }
				}],
				links: undefined
			}));
			console.log('Cannot load domain info');
			return;
		}

		let icon = default_icon;
		try { icon = require(`../../static/pics/coins/${foundChain[0].networkTokenTicket.toLowerCase()}.jpeg`).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${foundChain[0].networkTokenTicket.toLowerCase()}.jpg` ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${foundChain[0].networkTokenTicket.toLowerCase()}.png` ).default } catch (ignored) {}
		try { icon = require(`../../static/pics/coins/${foundChain[0].networkTokenTicket.toLowerCase()}.svg` ).default } catch (ignored) {}

		this.chainConfig = {
			chainId                      : this.chainId,
			chainName                    : foundChain[0].chainName,
			chainColorCode               : foundChain[0].chainColorCode,
			chainRPCUrl                  : foundChain[0].chainRPCUrl,
			networkTokenTicket           : foundChain[0].networkTokenTicket,
			EIPPrefix                    : foundChain[0].EIPPrefix,
			networkTokenDecimals         : foundChain[0].networkTokenDecimals,
			networkTokenIcon             : icon,
			isTestNetwork                : foundChain[0].isTestNetwork,
			explorerBaseUrl              : foundChain[0].explorerBaseUrl,
			explorerName                 : foundChain[0].explorerName,
			nftMinterContract721         : foundChain[0].nftMinterContract721,
			nftMinterContract1155        : foundChain[0].nftMinterContract1155,
		};

		this.store.dispatch(metamaskSetChainParams( this.chainConfig ));

		// await this.createNftMinterContract();
	}
	chainUpdated() {
		if ( window.location.href.toLowerCase().includes('wrap') ) {
			window.location.href = '/list';
		} else {
			window.location.reload();
		}
	}
	updateChainListener(authMethod: string) {
		if ( authMethod === 'METAMASK' ) {
			(window as any).ethereum.on('chainChanged',    () => { this.chainUpdated() });
			(window as any).ethereum.on('accountsChanged', () => { this.chainUpdated() });
		}
		if ( authMethod === 'WALLET_CONNECT' ) {
			this.wcProvider.on("accountsChanged",          () => { this.chainUpdated() });
			this.wcProvider.on("chainChanged",             () => { this.chainUpdated() });
		}
	}
	async createNftMinterContract() {

		try {
			this.nftMinterContract = new NftMinterContract({
				web3                    : this.web3,
				metamaskAdapter         : this,
				store                   : this.store,
				contract721Address      : this.chainConfig.nftMinterContract721!,
				contract1155Address     : this.chainConfig.nftMinterContract1155!,
				userAddress             : this.userAddress,
				t                       : this.t,
			});
		} catch(e: any) {
			this.store.dispatch(setError({
				text: e.message,
				buttons: [{
					text: 'Try again',
					clickFunc: () => { this.connect() }
				}],
				links: undefined
			}));
		}

		return;
	}
	getNftMinterContract() {
		if ( this.nftMinterContract ) { return this.nftMinterContract; }

		if ( !this.chainConfig || !this.chainConfig.nftMinterContract721 || !this.chainConfig.nftMinterContract1155 ) { return undefined; }

		this.nftMinterContract = new NftMinterContract({
			web3                    : this.web3,
			metamaskAdapter         : this,
			store                   : this.store,
			contract721Address      : this.chainConfig.nftMinterContract721!,
			contract1155Address     : this.chainConfig.nftMinterContract1155!,
			userAddress             : this.userAddress,
			t                       : this.t,
		});

		return this.nftMinterContract;
	}

	async createERC20Contracts(erc20Contracts: Array<string>) {
		erc20Contracts.forEach((item: string) => {
			const contract = new ERC20Contract({
				web3                : this.web3,
				store               : this.store,
				contractAddress     : item,
				contractType        : 'collateral',
				userAddress         : this.userAddress,
				whitelistContract   : this.whitelistContract,
			});

			this.erc20CollateralTokens = [
				...this.erc20CollateralTokens.filter((iitem) => { return iitem.contractAddress.toLowerCase() !== item.toLowerCase() }),
				contract
			]
		});
	}
	async addERC20Contracts(erc20Contract: string) {
		if ( erc20Contract === '' ) { return; }

		let contract = undefined;
		try {
			contract = new ERC20Contract({
				web3                : this.web3,
				store               : this.store,
				contractAddress     : erc20Contract,
				contractType        : 'collateral',
				userAddress         : this.userAddress,
				whitelistContract   : this.whitelistContract,
				delayedParams       : true,
			});

			await contract.getParams();
			contract.addCheckoutEventListener();

			if ( contract ) {
				this.erc20CollateralTokens = [
					...this.erc20CollateralTokens.filter((item) => { return item.contractAddress.toLowerCase() !== erc20Contract.toLowerCase() }),
					contract
				]
			}
		} catch(ignored) {}
	}
	getERC20Contract(address: string): ERC20Contract | undefined {
		const foundContract = this.erc20CollateralTokens.find((item: ERC20Contract) => { return item.contractAddress.toLowerCase() === address.toLowerCase() });
		if ( foundContract ) {
			return foundContract
		} else {
			return undefined;
		}
	}
	updateERC20Balances() {
		this.erc20CollateralTokens.forEach((item: ERC20Contract) => { item.getBalance(); });
	}
	async fetchNativeBalance() {
		const balance = new BigNumber(await this.web3.eth.getBalance(this.userAddress));
		this.store.dispatch(updateNativeBalance({ balance }));
	}
	updateAllBalances() {
		this.updateERC20Balances();
		this.fetchNativeBalance();
	}

}