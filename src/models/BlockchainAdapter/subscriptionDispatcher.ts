
import { Contract } from "web3-eth-contract";
import ERC20Contract from './erc20contract';
import MetamaskAdapter from './metamaskadapter';
import {
	AdvancedLoaderStageType,
	clearInfo,
	createAdvancedLoading,
	setError,
	setInfo,
	setLoading,
	unsetLoading,
	updateStepAdvancedLoading,
	_AdvancedLoadingStatus
} from "../../reducers";

import {
	SAFTPayOption,
	SAFTTariff,
} from './_types';
import { getABI } from '../_utils';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type SubscriptionDispatcherPropsType = {
	metamaskAdapter            : MetamaskAdapter,
	store                      : any,
	t                          : any,
	subscriptionContractAddress: string | undefined,
	serviceCode                : string,
	updateParentComponent      : () => void;
}

export default class SubscriptionDispatcher {

	metamaskAdapter               : MetamaskAdapter;
	store                         : any;
	t                             : any;

	updateParentComponent         : () => void;

	subscriptionContractAddress!  : undefined | string;
	subscriptionContract!         : Contract | undefined;

	serviceCode!                  : string;
	availableTariffs              : Array<SAFTTariff>;
	paymentTokens                 : Array<ERC20Contract>;

	subscriptionRemainings        : undefined | {
		timeRemaining: BigNumber,
		txRemaining: number,
	};

	constructor(props: SubscriptionDispatcherPropsType) {
		this.metamaskAdapter             = props.metamaskAdapter;
		this.store                       = props.store;
		this.t                           = props.t;
		this.updateParentComponent       = props.updateParentComponent;
		this.availableTariffs            = [];
		this.paymentTokens               = [];

		this.subscriptionContractAddress = props.subscriptionContractAddress;
		this.serviceCode                 = props.serviceCode;

		this.createContracts();
	}

	async createContracts() {

		if ( !this.subscriptionContractAddress || this.subscriptionContractAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'  ) {
			this.subscriptionRemainings = undefined;
			this.subscriptionContract = undefined;
			return;
		}

		if ( !this.store.getState()._loading ) {
			this.store.dispatch(setLoading({ msg: this.t('Checking subscription') }));
		}

		let subscriptionContractABI;
		try {
			subscriptionContractABI = getABI(this.metamaskAdapter.chainId || 0, this.subscriptionContractAddress, 'subscriptionContract');
		} catch(e) {
			console.log(`Cannot load ${this.subscriptionContractAddress} subscriptionContract abi:`, e);
			throw new Error(`Cannot load subscriptionContract abi`);
		}
		this.subscriptionContract = new this.metamaskAdapter.web3.eth.Contract(subscriptionContractABI, this.subscriptionContractAddress);

		await this.fetchTariffs();
		await this.checkSubcription();
		if ( this.store.getState()._loading.toLowerCase().includes('subscription') ) {
			this.store.dispatch(unsetLoading());
		}
	}

	isLocked() {
		if ( !this.subscriptionRemainings ) { return false; }

		const timeLock = this.subscriptionRemainings.timeRemaining.lte( new BigNumber(new Date().getTime()).dividedBy(1000) );
		if ( !timeLock ) { return false; }
		const qtyLock  = this.subscriptionRemainings.txRemaining === 0;
		if ( !qtyLock ) { return false; }

		return true;
	}
	async checkSubcription() {
		const defaultRemainings = {
			timeRemaining: new BigNumber(0),
			txRemaining  : 0
		};

		if ( !this.subscriptionContract ) {
			this.setRemainings(defaultRemainings); return;
		}

		// const hasSubscription = await this.subscriptionContract.methods.checkUserSubscription(this.metamaskAdapter.userAddress, this.serviceCode).call();
		// if ( !hasSubscription ) {
		// 	this.setRemainings(defaultRemainings); return;
		// }

		const userTicket = await this.subscriptionContract.methods.getUserTickets(this.metamaskAdapter.userAddress).call();

		if ( userTicket && userTicket.length && this.availableTariffs && this.availableTariffs.length ) {
			for ( let idx = 0; idx < this.availableTariffs.length; idx++ ) {

				const tariff = this.availableTariffs[idx];
				const ticket = userTicket[idx];

				if ( !tariff.services.includes(this.serviceCode) ) { continue; }

				const validUntil = new BigNumber(ticket.validUntil);
				const countsLeft = parseInt(ticket.countsLeft)
				const now = new BigNumber(new Date().getTime()).dividedBy(1000);

				if ( validUntil.gt(now) || countsLeft > 0 ) {
					this.setRemainings({
						timeRemaining: validUntil,
						txRemaining  : countsLeft,
					});
					return;
				}

			}
		}

		this.setRemainings(defaultRemainings);
	}
	setRemainings(remainings: { timeRemaining: BigNumber, txRemaining: number }) {
		this.subscriptionRemainings = remainings;
		this.updateParentComponent();
	}
	async fetchTariffs() {
		if ( !this.subscriptionContract ) { return; }

		const fetchedTariffs = await this.subscriptionContract.methods.getAvailableTariffs().call();
		this.availableTariffs = fetchedTariffs
			.map((item: SAFTTariff, idx: number) => { return { ...item, idx } })
			.filter((item: SAFTTariff) => {
				return item.services.includes(this.serviceCode) &&
						item.subscription.isAvailable
			})
			.map((item: SAFTTariff) => {
				return {
					...item,
					subscription: {
						...item.subscription,
						timelockPeriod: new BigNumber(item.subscription.timelockPeriod),
						ticketValidPeriod:  new BigNumber(item.subscription.ticketValidPeriod),
					},
					payWith: item.payWith.map((iitem: SAFTPayOption, idx: number) => { return { ...iitem, paymentAmount: new BigNumber(iitem.paymentAmount), idx } })
				}
			});

		for ( const item of this.availableTariffs ) {
			for ( const iitem of item.payWith ) {
				const foundToken = this.paymentTokens.find((iiitem) => { return iiitem.contractAddress.toLowerCase() === iitem.paymentToken.toLowerCase() });
				if ( !foundToken ) {
					this.paymentTokens.push(new ERC20Contract({
						web3: this.metamaskAdapter.web3,
						store: this.store,
						contractAddress: iitem.paymentToken,
						contractType: 'subscriptionPayment',
						userAddress: this.metamaskAdapter.userAddress,
					}))
				}
			}
		}

		this.updateParentComponent();
	}

	async buySubscription(tariffIdx: number, paymentToken: string) {
		if ( !this.subscriptionContract ) { return; }

		const foundERC20Contract = this.paymentTokens.find((item) => { return item.contractAddress.toLowerCase() === paymentToken.toLowerCase() });
		if ( !foundERC20Contract ) { return; }

		const foundTariff = this.availableTariffs.find((item) => { return item.idx === tariffIdx });
		if ( !foundTariff ) { return; }

		const foundPayOption = foundTariff.payWith.find((item) => { return item.paymentToken.toLowerCase() === paymentToken.toLowerCase() });
		if ( !foundPayOption ) { return; }

		const loaderStages: Array<AdvancedLoaderStageType> = [
			{
				id: 'approveerc20',
				sortOrder: 1,
				text: `Approving ${foundERC20Contract.erc20Params.symbol}`,
				status: _AdvancedLoadingStatus.loading
			},
			{
				id: 'buy',
				sortOrder: 1,
				text: `Buying subscription`,
				status: _AdvancedLoadingStatus.queued
			},
		];
		const advLoader = {
			title: 'Waiting for buy',
			stages: loaderStages
		};
		this.store.dispatch(createAdvancedLoading(advLoader));

		const balance = await foundERC20Contract.getBalance();
		if ( balance.balance.lt( foundPayOption.paymentAmount ) ) {
			this.store.dispatch(unsetLoading());
			this.store.dispatch(setError({
				text: `${this.t('Not enough')} ${foundERC20Contract.erc20Params.symbol}`,
				buttons: undefined,
				links: undefined,
			}));
			return;
		}
		if ( balance.allowance.lt( foundPayOption.paymentAmount ) ) {
			try {
				await foundERC20Contract.makeAllowance(foundPayOption.paymentAmount, this.subscriptionContractAddress || '0x0000000000000000000000000000000000000000');
			} catch (e: any) {
				this.store.dispatch(unsetLoading());
				this.store.dispatch(setError({
					text: `${this.t('Cannot approve')} ${foundERC20Contract.erc20Params.symbol}: ${e.message}`,
					buttons: undefined,
					links: undefined,
				}));
				return;
			}
		}
		this.store.dispatch(updateStepAdvancedLoading({
			id: 'approveerc20',
			sortOrder: 1,
			text: `Approving ${foundERC20Contract.erc20Params.symbol}`,
			status: _AdvancedLoadingStatus.complete
		}));
		this.store.dispatch(updateStepAdvancedLoading({
			id: 'buy',
			sortOrder: 1,
			text: `Buying subscription`,
			status: _AdvancedLoadingStatus.loading
		}));

		const tx = this.subscriptionContract.methods.buySubscription(tariffIdx, foundPayOption.idx, this.metamaskAdapter.userAddress);

		let errMsg = '';
		try {
			await tx.estimateGas({ from: this.metamaskAdapter.userAddress });
		} catch(e: any) {
			try {
				console.log('Cannot wrap before send: ', e);
				const errorParsed = JSON.parse(e.message.slice(e.message.indexOf('\n')));
				errMsg = errorParsed.originalError.message
					.replace('execution reverted: ', '');
			} catch(ignored) {}
		}
		if ( errMsg !== '' ) {
			this.store.dispatch(setError({
				text: `${this.t('Cannot wrap token')}: ${errMsg}`,
				buttons: undefined,
				links: undefined,
			}));
			this.store.dispatch(unsetLoading());
			return;
		}

		tx
			.send({ from: this.metamaskAdapter.userAddress })
			.then((data: any) => {
				this.store.dispatch(unsetLoading());
				setTimeout(() => {
					this.metamaskAdapter.updateAllBalances();
					this.checkSubcription();
				}, 100);

				this.store.dispatch(setInfo({
					text: `${this.t('Subscription is Successfully bought')}`,
					buttons: [{
					text: 'Ok',
					clickFunc: () => {
						this.store.dispatch(clearInfo());
					}
					}],
					links: [{
						text: `View on ${this.metamaskAdapter.chainConfig.explorerName}`,
						url: `${this.metamaskAdapter.chainConfig.explorerBaseUrl}/tx/${data.transactionHash}`
					}]
				}));
			})
			.catch((e: any) => {
				console.log('Cannot wrap after send: ', e);

				this.store.dispatch(unsetLoading());

				let errorMsg = '';
				if ('message' in e) {
					errorMsg = e.message
				} else {
					try {
						const errorParsed = JSON.parse(e.message.slice(e.message.indexOf('\n')));
						errorMsg = errorParsed.originalError.message;
					} catch(ignored) {}
				}

				let links = undefined;
				if ('transactionHash' in e) {
					links = [{ text: `${this.store.getState().metamaskAdapter.explorerName}`, url: `${this.store.getState().metamaskAdapter.explorerBaseUrl}/tx/${e.transactionHash}` }];
				} else {
					try {
						const errorParsed = JSON.parse(e.message.slice(e.message.indexOf('\n')));
						const txHash = errorParsed.transactionHash;
						links = [{ text: `${this.store.getState().metamaskAdapter.explorerName}`, url: `${this.store.getState().metamaskAdapter.explorerBaseUrl}/tx/${txHash}` }];
					} catch(ignored) {}
				}

				if ( !errorMsg.includes('was not mined within 50 blocks') ) {
					this.store.dispatch(setError({
						text: `${this.t('Cannot wrap token')}: ${errorMsg}`,
						buttons: undefined,
						links: links,
					}));
				}
			});

	}

}