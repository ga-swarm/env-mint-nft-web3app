
import React from 'react';
import {
	MetamaskAdapter,
	ERC20Contract,
	SAFTTariff,
	SubscriptionDispatcher,
} from '../../models/BlockchainAdapter';

import { withTranslation, } from "react-i18next";

import {
	tokenToFloat,
} from '../../models/_utils';

import BigNumber from 'bignumber.js';
import Tippy from '@tippyjs/react';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type SubscriptionRendererProps = {
	t                      : any,
	subscriptionDispatcher : SubscriptionDispatcher;
}
export type SubscriptionRendererState = {
	balancesNative   : BigNumber,
	decimalsNative   : number,
	symbolNative     : string,
	iconNative       : string,
	EIPPrefix        : string,
	chainId          : number,
	metamaskLogged   : boolean,
	explorerBaseUrl  : string,

	paymentTokens: Array<ERC20Contract>,

	subscriptionRemainings: undefined | {
		timeRemaining: BigNumber,
		txRemaining: number,
	};
	subscriptionTariffs: Array<SAFTTariff>,
	subscriptionPopupOpened: boolean,
	subscriptionTariffSelectedIdx: undefined | number,
	subscriptionTokenSelected    : string,
}

class SubscriptionRenderer extends React.Component<SubscriptionRendererProps, SubscriptionRendererState> {

	store                  : any;
	metamaskAdapter        : MetamaskAdapter;
	unsubscribe!           : Function;
	t                      : any;
	subscriptionDispatcher : SubscriptionDispatcher;

	constructor(props: SubscriptionRendererProps) {
		super(props);

		this.store                   = props.subscriptionDispatcher.store;
		this.metamaskAdapter         = props.subscriptionDispatcher.metamaskAdapter;
		this.t                       = props.t;
		this.subscriptionDispatcher  = props.subscriptionDispatcher;
		const subscriptionTariffs    = this.subscriptionDispatcher.availableTariffs;
		const paymentTokens          = this.subscriptionDispatcher.paymentTokens;
		const subscriptionRemainings = this.subscriptionDispatcher.subscriptionRemainings;

		let subscriptionTariffSelectedIdx = undefined;
		let subscriptionTokenSelected     = '';

		this.state = {
			balancesNative   : this.store.getState().account.balance,
			decimalsNative   : this.store.getState().metamaskAdapter.networkTokenDecimals,
			symbolNative     : this.store.getState().metamaskAdapter.networkTokenTicket,
			iconNative       : this.store.getState().metamaskAdapter.networkTokenIcon,
			EIPPrefix        : this.store.getState().metamaskAdapter.EIPPrefix,

			chainId          : this.store.getState().metamaskAdapter.chainId,
			metamaskLogged   : this.store.getState().metamaskAdapter.logged,
			explorerBaseUrl  : this.store.getState().metamaskAdapter.explorerBaseUrl,

			subscriptionRemainings,
			paymentTokens,
			subscriptionTariffs,
			subscriptionTariffSelectedIdx,
			subscriptionTokenSelected,

			subscriptionPopupOpened: false,
		}
	}

	componentDidMount() {
		this.unsubscribe = this.store.subscribe(() => {
			this.setState({
				balancesNative        : this.store.getState().account.balance,
				decimalsNative        : this.store.getState().metamaskAdapter.networkTokenDecimals,
				iconNative            : this.store.getState().metamaskAdapter.networkTokenIcon,
				symbolNative          : this.store.getState().metamaskAdapter.networkTokenTicket,
				EIPPrefix             : this.store.getState().metamaskAdapter.EIPPrefix,
				chainId               : this.store.getState().metamaskAdapter.chainId,
				metamaskLogged        : this.store.getState().metamaskAdapter.logged,
				explorerBaseUrl       : this.store.getState().metamaskAdapter.explorerBaseUrl,

				subscriptionTariffs   : this.subscriptionDispatcher.availableTariffs,
				paymentTokens         : this.subscriptionDispatcher.paymentTokens,
				subscriptionRemainings: this.subscriptionDispatcher.subscriptionRemainings,
			});
		});
 	}
	componentWillUnmount() { this.unsubscribe(); }

	getSubscriptionBlock() {
		if ( this.subscriptionDispatcher.isLocked() ) {
			return (
				<div className="bw-subscib">
					<div className="d-inline-block mr-2 my-3">To use the Batch Wrap you need to  </div>
					<button
						className="btn btn-outline"
						onClick={() => {
							this.setState({
								subscriptionPopupOpened      : true,
								subscriptionTariffs          : this.subscriptionDispatcher.availableTariffs,
								paymentTokens                : this.subscriptionDispatcher.paymentTokens,
								subscriptionTariffSelectedIdx: undefined,
								subscriptionTokenSelected     : '',
							});
						}}
					>Subscribe</button>
				</div>
			)
		}

		if ( !this.state.subscriptionRemainings ) { return null; }

		if ( parseInt(`${this.state.subscriptionRemainings.txRemaining}`) !== 0 ) {
			return (
				<div className="bw-subscib">
					You have <span className="days">{ this.state.subscriptionRemainings.txRemaining } { this.state.subscriptionRemainings.txRemaining === 1 ? 'wrap' : 'wraps' }</span> left
				</div>
			)
		}

		const now = new BigNumber(new Date().getTime()).dividedBy(1000);
		const diff = this.state.subscriptionRemainings.timeRemaining.minus(now);

		return (
			<div className="bw-subscib">
				Your subscription expires in <span className="days">{ this.convertTimeToStr(diff) }</span>
			</div>
		)
	}
	getSubscriptionERC20Balance() {

		const foundToken = this.state.paymentTokens.find((item) => { return item.contractAddress.toLowerCase() === this.state.subscriptionTokenSelected.toLowerCase() });
		if ( !foundToken || !foundToken.erc20Params ) { return null; }

		return (
			<div className="c-add__max">
				<span>Max: </span>
				<button>{ tokenToFloat(foundToken.erc20Params.balance, foundToken.erc20Params.decimals || 18).toString() }</button>
				<span className="ml-2">Allowance: </span>
				<button>{ tokenToFloat(foundToken.erc20Params.allowance, foundToken.erc20Params.decimals || 18).toString() }</button>
			</div>
		)
	}
	convertTimeToStr(diff: BigNumber) {

		const monthsRemaining = diff.dividedToIntegerBy(3600).dividedToIntegerBy(24).dividedToIntegerBy(30);
		if ( monthsRemaining.gt(0) ) {
			if ( monthsRemaining.eq( 1 ) ) { return `${monthsRemaining.toFixed(0)} ${this.t('month')}` }
			return `${monthsRemaining.toFixed(0)} ${this.t('months')}`
		}

		const daysRemaining = diff.dividedToIntegerBy(3600).dividedToIntegerBy(24);
		if ( daysRemaining.gt(0) ) {
			if ( daysRemaining.eq( 1 ) ) { return `${daysRemaining.toFixed(0)} ${this.t('day')}` }
			return `${daysRemaining.toFixed(0)} ${this.t('days')}`
		}

		const hoursRemaining = diff.dividedToIntegerBy(3600);
		if ( hoursRemaining.gt(0) ) {
			if ( hoursRemaining.eq( 1 ) ) { return `${hoursRemaining.toFixed(0)} ${this.t('hour')}` }
			return `${hoursRemaining.toFixed(0)} ${this.t('hours')}`
		}

		const minutesRemaining = diff.dividedToIntegerBy(60);
		if ( minutesRemaining.gt(0) ) {
			if ( minutesRemaining.eq( 1 ) ) { return `${minutesRemaining.toFixed(0)} ${this.t('minute')}` }
			return `${minutesRemaining.toFixed(0)} ${this.t('minutes')}`
		}

		if ( diff.eq( 1 ) ) { return `${diff.toFixed(0)} ${this.t('second')}` }
		return `${diff.toFixed(0)} ${this.t('seconds')}`

	}
	getPaymentToken(address: string) {
		const foundToken = this.state.paymentTokens.find((item) => { return item.contractAddress.toLowerCase() === address.toLowerCase() });
		if ( !foundToken ) {
			return undefined;
		}

		return foundToken.erc20Params;
	}
	getTicketDetails() {
		if ( typeof(this.state.subscriptionTariffSelectedIdx) === undefined || this.state.subscriptionTokenSelected === '' ) { return null; }

		const foundTicket = this.state.subscriptionTariffs.find((item) => { return item.idx === this.state.subscriptionTariffSelectedIdx });
		if ( !foundTicket ) { return null; }

		let priceStr = '';
		const foundPayOption = foundTicket.payWith.find((item) => { return this.state.subscriptionTokenSelected.toLowerCase() === item.paymentToken.toLowerCase() })
		if ( foundPayOption ) {
			const payToken = this.getPaymentToken(foundPayOption.paymentToken);
			const amountParsed = payToken ? tokenToFloat(foundPayOption.paymentAmount, payToken.decimals || 1).toString() : `${foundPayOption.paymentAmount}*`;
			const symbolParsed = payToken ? payToken.symbol : foundPayOption.paymentToken;
			priceStr = `${amountParsed} ${symbolParsed}`
		}

		return (
			<div className="col col-12 col-sm-12 order-sm-12 mt-4 mt-sm-0">
				{
					!foundTicket.subscription.timelockPeriod.eq(0) ? (
						<p>Lock time: { this.convertTimeToStr(foundTicket.subscription.timelockPeriod) }
							<Tippy
								content={ this.t('Time to lock your collateral tokens.') }
								appendTo={ document.getElementsByClassName("wrapper")[0] }
								trigger='mouseenter'
								interactive={ false }
								arrow={ false }
								maxWidth={ 512 }
							>
								<span className="i-tip ml-1"></span>
							</Tippy>
						</p>
					) : null }
				{
					priceStr !== '' ? (
						<p>Price: { priceStr }
							<Tippy
								content={ this.t('Number of collateral tokens that will be locked.') }
								appendTo={ document.getElementsByClassName("wrapper")[0] }
								trigger='mouseenter'
								interactive={ false }
								arrow={ false }
								maxWidth={ 512 }
							>
								<span className="i-tip ml-1"></span>
							</Tippy>
						</p>
					) : null }
				{
					!foundTicket.subscription.ticketValidPeriod.eq(0) ? (
						<p>Subscription time: { this.convertTimeToStr(foundTicket.subscription.ticketValidPeriod) }
							<Tippy
								content={ this.t('The period of time during which the subscription is valid. There is no limit on the number of times the service can be used.') }
								appendTo={ document.getElementsByClassName("wrapper")[0] }
								trigger='mouseenter'
								interactive={ false }
								arrow={ false }
								maxWidth={ 512 }
							>
								<span className="i-tip ml-1"></span>
							</Tippy>
						</p>
					) : null }
				{
					parseInt(`${foundTicket.subscription.counter}`) !== 0 ? (
						<p>TX count: { foundTicket.subscription.counter }
							<Tippy
								content={ this.t('The number of calls to the service according to the price plan. There is no time limit.') }
								appendTo={ document.getElementsByClassName("wrapper")[0] }
								trigger='mouseenter'
								interactive={ false }
								arrow={ false }
								maxWidth={ 512 }
							>
								<span className="i-tip ml-1"></span>
							</Tippy>
						</p>
					) : null }
			</div>
		)
	}
	getSubscriptionPopup() {
		return (
			<div className="modal">
			<div
					className="modal__inner"
					onMouseDown={(e) => {
						e.stopPropagation();
						if ((e.target as HTMLTextAreaElement).className === 'modal__inner' || (e.target as HTMLTextAreaElement).className === 'container') {
							this.setState({
								subscriptionTariffSelectedIdx: undefined,
								subscriptionTokenSelected: '',
								subscriptionPopupOpened: false,
							});
						}
					}}
				>
			<div className="modal__bg"></div>
			<div className="container">
			<div className="modal__content">
				<div
					className="modal__close"
					onClick={() => {
						this.setState({
							subscriptionTariffSelectedIdx: undefined,
							subscriptionTokenSelected: '',
							subscriptionPopupOpened: false,
						});
					}}
				>
					<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fillRule="evenodd" clipRule="evenodd" d="M35.9062 36.3802L0.69954 1.17351L1.25342 0.619629L36.4601 35.8263L35.9062 36.3802Z" fill="white"></path>
						<path fillRule="evenodd" clipRule="evenodd" d="M0.699257 36.3802L35.9059 1.17351L35.3521 0.619629L0.145379 35.8263L0.699257 36.3802Z" fill="white"></path>
					</svg>
				</div>
				<div className="c-add">
					<div className="c-add__text">
						<div className="h2">SAFT Subscription</div>
					</div>
					<div className="c-add__form">
						<div className="form-row">
							<div className="col col-12 col-sm-7 order-sm-1">
								<label className="input-label">Choose a plan</label>
								<select
									className="input-control"
									defaultValue={ `${this.state.subscriptionTariffSelectedIdx}${this.state.subscriptionTokenSelected}` }
									onClick={() => { this.forceUpdate(); }}
									onChange={(e) => {
										if ( e.target.value === '' ) {
											this.setState({
												subscriptionTariffSelectedIdx: undefined,
												subscriptionTokenSelected: '',
											});
											return;
										}
										const subscriptionIdx = parseInt(e.target.value.split(';')[0]);
										const paymentToken    = e.target.value.split(';')[1];
										this.setState({
											subscriptionTariffSelectedIdx: subscriptionIdx,
											subscriptionTokenSelected: paymentToken,
										})
									}}
								>
									{
										[
											(
												<option
													key={''}
													value={ '' }
												>
													—
												</option>
											),
											...this.state.subscriptionTariffs.map((item) => {
												return item.payWith.map((iitem) => {
													const payToken = this.getPaymentToken(iitem.paymentToken);
													const amountParsed = payToken ? tokenToFloat(iitem.paymentAmount, payToken.decimals || 1).toString() : `${iitem.paymentAmount}*`;
													const symbolParsed = payToken ? payToken.symbol : iitem.paymentToken;

													if ( item.subscription.ticketValidPeriod.gt(0) && item.subscription.counter > 0 ) {
														return (
															<option
																key={`${item.idx}${iitem.paymentToken}`}
																value={ `${item.idx};${iitem.paymentToken}` }
															>
																{`${ this.convertTimeToStr(item.subscription.ticketValidPeriod) } and ${ item.subscription.counter } TXs / ${amountParsed} ${symbolParsed}`}
															</option>
														)
													}

													if ( item.subscription.ticketValidPeriod.gt(0) ) {
														return (
															<option
																key={`${item.idx}${iitem.paymentToken}`}
																value={ `${item.idx};${iitem.paymentToken}` }
															>
																{`${ this.convertTimeToStr(item.subscription.ticketValidPeriod) } / ${amountParsed} ${symbolParsed}`}
															</option>
														)
													}

													if ( item.subscription.counter > 0 ) {
														return (
															<option
																key={`${item.idx}${iitem.paymentToken}`}
																value={ `${item.idx};${iitem.paymentToken}` }
															>
																{`${ item.subscription.counter } TXs / ${amountParsed} ${symbolParsed}`}
															</option>
														)
													}

													return null
												})
											})
										]
									}
								</select>
							</div>
							<div className="col col-12 order-sm-3 mt-3">
								{ this.getSubscriptionERC20Balance() }
							</div>
							<div className="col col-12 col-sm-5 order-sm-2 mt-4 mt-sm-0">
								<label className="input-label d-none d-sm-block"> </label>
								<button
									className="btn btn-grad w-100"
									disabled={ typeof(this.state.subscriptionTariffSelectedIdx) === undefined || this.state.subscriptionTokenSelected === '' }
									onClick={() => {
										if ( typeof this.state.subscriptionTariffSelectedIdx === 'undefined' ) { return; }
										this.subscriptionDispatcher.buySubscription(this.state.subscriptionTariffSelectedIdx, this.state.subscriptionTokenSelected)
											.then(() => {
												this.setState({
													subscriptionTariffSelectedIdx: undefined,
													subscriptionTokenSelected: '',
													subscriptionPopupOpened: false
												})
											});
									}}
								>Subscribe</button>
							</div>

							{ this.getTicketDetails() }

						</div>
					</div>
				</div>
			</div>
			</div>
			</div>
			</div>
		)
	}

	render() {

		return (
			<React.Fragment>
			{ this.getSubscriptionBlock() }
			{
				this.state.subscriptionPopupOpened ?
					this.getSubscriptionPopup() : null
			}
			</React.Fragment>
		)
	}
}

export default withTranslation("translations")(SubscriptionRenderer);