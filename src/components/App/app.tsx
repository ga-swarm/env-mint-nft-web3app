
import React from 'react';
import { createStore } from 'redux';
import {
	BrowserRouter as Router,
	Route,
	Switch,
} from "react-router-dom";
import 'tippy.js/dist/tippy.css';

import Header              from '../Header';
import Footer              from '../Footer';
import MainPage            from '../MainPage';
import AdvancedLoader      from '../AdvancedLoader';
import ErrorPage           from '../ErrorPage';
import MintPage            from '../MintPage';

import {
	MetamaskAdapter,
} from '../../models/BlockchainAdapter';
import {
	AdvancedLoaderType,
	clearError,
	clearInfo,
	reducer,
	setAuthMethod,
} from '../../reducers';

import icon_envelop        from '../../static/pics/envelop.svg';
import icon_error          from '../../static/pics/i-error.svg';
import i_external_green_sm from '../../static/pics/icons/i-external-green-sm.svg';
import metamask_icon       from '../../static/pics/i-metamask.svg';
import walletconnect_icon  from '../../static/pics/i-connect.svg';

import { withTranslation } from "react-i18next";

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type AppParamsType = {
	i18n: any,
	t   : any,
}
type AppState = {
	currentPage: string,
	loading    : string,
	advancedLoading: undefined | AdvancedLoaderType,
	error      : undefined | {
		title?: string,
		text  : string | Array<string>,
		buttons: undefined | Array<{
			text: string,
			clickFunc: Function,
		}>,
		links: undefined | Array<{
			text: string,
			url : string,
		}>,
	},
	info       : undefined | {
		title?: string,
		text  : string | Array<string>,
		buttons: undefined | Array<{
			text: string,
			clickFunc: Function,
		}>,
		links: undefined | Array<{
			text: string,
			url : string,
		}>,
	},
	authMethodSelector: boolean,
	canCloseAuthMethodSelector: boolean,
}

class App extends React.Component<AppParamsType> {
	store          : any;
	metamaskAdapter: MetamaskAdapter;
	unsubscribe!   : Function;
	state          : AppState;

	i18n: any;
	t   : any;

	constructor(props: AppParamsType) {
		super(props);

		this.i18n = this.props.i18n;
		this.t    = this.props.t;

		console.log('REACT_APP_ORACLE_API_BASE_URL', process.env.REACT_APP_ORACLE_API_BASE_URL);
		console.log('REACT_APP_ORACLE_API_MINT_URL', process.env.REACT_APP_ORACLE_API_MINT_URL);

		if ( process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT.toLowerCase() === 'production' ) {
			this.store = createStore(reducer);
		} else {
			this.store = createStore(reducer,(window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());
		}
		this.metamaskAdapter = new MetamaskAdapter({ store: this.store, t: this.t })

		this.state = {
			currentPage               : this.store.getState().currentPage,
			loading                   : this.store.getState()._loading,
			advancedLoading           : this.store.getState()._advancedLoading,
			error                     : this.store.getState()._error,
			info                      : this.store.getState()._info,
			authMethodSelector        : false,
			canCloseAuthMethodSelector: true,
		};
	}

	async componentDidMount() {
		this.unsubscribe = this.store.subscribe(() => {
			this.setState({
				currentPage    : this.store.getState().currentPage,
				loading        : this.store.getState()._loading,
				advancedLoading: this.store.getState()._advancedLoading,
				error          : this.store.getState()._error,
				info           : this.store.getState()._info,
				success        : this.store.getState()._success,
			});
		});

		const prevAuthMethod = localStorage.getItem('provider_type');
		if ( prevAuthMethod ) {
			this.store.dispatch(setAuthMethod( prevAuthMethod ));
			await this.metamaskAdapter.connect();
		}
 	}
 	componentWillUnmount() { this.unsubscribe(); }

	getOverlays() {

		if ( this.state.advancedLoading ) {
			return ( <AdvancedLoader data={ this.state.advancedLoading } /> )
		}

		const getErrorBtns = (msg: string) => {
			if ( msg === 'error' ) {
				if (this.state.error?.buttons) {
					return this.state.error.buttons.map((item, idx) => {
						let btnClass = '';
						if ( this.state.error && this.state.error.buttons && idx + 1 === this.state.error.buttons.length ) {
							btnClass = 'btn btn-outline'
						} else {
							btnClass = 'btn btn-grad'
						}
						return (
							<div
								className="col-12 col-sm-auto mb-3 mb-md-0"
								key={ item.text }
							>
								<button
									className={ btnClass }
									onClick={() => {
										item.clickFunc();
									}}
								>{ item.text }</button>
							</div>
						)
					})
				} else {
					return (
						<div
							className="col-12 col-sm-auto mb-3 mb-md-0"
							key={ '_default' }
						>
							<button
								className="btn btn-grad"
								onClick={() => {
									this.store.dispatch(clearError());
								}}
							>{ this.t('ACCEPT THIS FACT') }</button>
						</div>
					)
				}
			}
			if ( msg === 'info' ) {
				if (this.state.info?.buttons) {
					return this.state.info.buttons.map((item, idx) => {
						let btnClass = '';
						if ( this.state.info && this.state.info.buttons && idx + 1 === this.state.info.buttons.length ) {
							btnClass = 'btn btn-outline'
						} else {
							btnClass = 'btn btn-grad'
						}
						return (
							<div
								className="col-12 col-sm-auto mb-3 mb-md-0"
								key={ item.text }
							>
								<button
									className={ btnClass }
									onClick={() => {
										item.clickFunc();
									}}
								>{ item.text }</button>
							</div>
						)
					})
				} else {
					return (
						<div
							className="col-12 col-sm-auto mb-3 mb-md-0"
							key={ '_default' }
						>
							<button
								className="btn btn-grad"
								onClick={() => {
									this.store.dispatch(clearInfo());
								}}
							>{ this.t('ACCEPT THIS FACT') }</button>
						</div>
					)
				}
			}
		}
		const getLinks = (msg: string) => {
			if ( msg === 'error' ) {
				if (this.state.error?.links) {
					return this.state.error.links.map((item) => {
						return (
							<a
								className="ex-link mr-3"
								key={ item.url }
								href={ item.url }
								target="_blank" rel="noopener noreferrer"
							>
								Transaction
								<img className="i-ex" src={ i_external_green_sm } alt="" />
							</a>
						)
					})
				}
			}
			if ( msg === 'info' ) {
				if (this.state.info?.links) {
					return this.state.info.links.map((item) => {
						return (
							<a
								className="ex-link mr-3"
								key={ item.url }
								href={ item.url }
								target="_blank" rel="noopener noreferrer"
							>
								Transaction
								<img className="i-ex" src={ i_external_green_sm } alt="" />
							</a>
						)
					})
				}
			}
		}

		if ( this.state.error ) {
			return (
				<div className="modal">
				<div className="modal__inner">
				<div className="modal__bg"></div>
				<div className="container">
				<div className="modal__content">
					<div className="c-success">
						<img className="c-success__img" src={ icon_error } alt="" />
						<div className="h2">{ this.state.error.title || this.t('Error Screen') }</div>
						<p>{ getLinks('error') }</p>
						{
							this.state.error.text instanceof Array ?
							this.state.error.text.map((item) => { return (<p>{ item }</p>) }) :
							( <p>{ this.state.error.text }</p> )
						}
						<div className="modal__btns">
							{ getErrorBtns('error') }

						</div>
					</div>
				</div>
				</div>
				</div>
				</div>
			)
		}

		if ( this.state.loading ) {
			return (
				<div className="modal">
				<div className="modal__inner">
				<div className="modal__bg"></div>
				<div className="container">
				<div className="modal__content">
					<div className="c-success">
						<img className="c-success__img" src={ icon_envelop } alt="" />
						<div className="h2">
							{ this.t('Loading') }
							<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
						</div>
						<p>{ this.state.loading }</p>
					</div>
				</div>
				</div>
				</div>
				</div>
			)
		}
		if ( this.state.info ) {
			return (
				<div className="modal">
				<div className="modal__inner">
				<div className="modal__bg"></div>
				<div className="container">
				<div className="modal__content">
					<div className="c-success">
						<img className="c-success__img" src={ icon_envelop } alt="" />
						<div className="h2">{ this.state.info.title }</div>
						<p>{ getLinks('info') }</p>
						{
							this.state.info.text instanceof Array ?
							this.state.info.text.map((item) => { return (<p>{ item }</p>) }) :
							( <p>{ this.state.info.text }</p> )
						}
						<div className="modal__btns">
							{ getErrorBtns('info') }
						</div>
					</div>
				</div>
				</div>
				</div>
				</div>
			)
		}
	}
	getAuthMethodSelector() {
		if ( !this.state.authMethodSelector ) { return '' }

		return (
			<div className="modal">
			<div className="modal__inner" onClick={ (e) => {
				e.stopPropagation();
				if ((e.target as HTMLTextAreaElement).className === 'modal__inner') {
					if ( this.state.canCloseAuthMethodSelector ) {
						this.setState({ authMethodSelector: false });
					} else {
						this.setState({ authMethodSelector: false });
						window.location.href = "/";
					}
				}
			}}>
			<div className="modal__bg"></div>
			<div className="container">
			<div className="modal__content">

				<div
					className="modal__close"
					onClick={() => {
						if ( this.state.canCloseAuthMethodSelector ) {
							this.setState({ authMethodSelector: false });
						} else {
							this.setState({ authMethodSelector: false });
							window.location.href = "/";
						}
					}}
				>
					<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fillRule="evenodd" clipRule="evenodd" d="M35.9062 36.3802L0.69954 1.17351L1.25342 0.619629L36.4601 35.8263L35.9062 36.3802Z" fill="white"></path>
						<path fillRule="evenodd" clipRule="evenodd" d="M0.699257 36.3802L35.9059 1.17351L35.3521 0.619629L0.145379 35.8263L0.699257 36.3802Z" fill="white"></path>
					</svg>
				</div>
				<div className="modal__header">
					<div className="h2">Choose your wallet</div>
				</div>
				<div className="c-connect">
					<div className="modal__btns">
						<div className="col mb-4 mb-sm-0">
							<button
								className="btn-wallet"
								style={{ width: '100%' }}
								onClick={async () => {
									this.store.dispatch(setAuthMethod('METAMASK'));
									await this.metamaskAdapter.connect();
									this.setState({ authMethodSelector: false });
								}}
							>
								<span className="img">
									<img src={ metamask_icon } alt="" />
								</span>
								<span>Metamask</span>
							</button>
						</div>
						<div className="col">
						<button
									className="btn-wallet"
									style={{ width: '100%' }}
									onClick={async () => {
										this.store.dispatch(setAuthMethod('WALLET_CONNECT'));
										await this.metamaskAdapter.connect();
										this.setState({ authMethodSelector: false });
									}}
								>
								<span className="img">
									<img src={ walletconnect_icon } alt="" />
								</span>
								<span>Walletconnect</span>
							</button>
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
			<Router>
				{/* <button onClick={() => { this.i18n.changeLanguage('en');     }}>EN</button>
				<button onClick={() => { this.i18n.changeLanguage('ru_lol'); }}>RU_LOL</button> */}
				<Header
					store           = { this.store }
					metamaskAdapter = { this.metamaskAdapter }
					showAuthMethodSelector = {() => { this.setState({ authMethodSelector: true }) }}
				/>

				<Switch>

					<Route path="/" exact>
						<MainPage store = { this.store } />
					</Route>

					<Route path="/mint" exact>
						<MintPage
							store = { this.store }
							metamaskAdapter = { this.metamaskAdapter }
							showAuthMethodSelector = {( canClose: boolean ) => { this.setState({ authMethodSelector: true, canCloseAuthMethodSelector: canClose }) }}
						/>
					</Route>

					<Route path="*">
						<ErrorPage store = { this.store } />
					</Route>
				</Switch>

				{ this.getAuthMethodSelector() }
				{ this.getOverlays() }
				<Footer />
			</Router>
		)
	}
}

export default withTranslation("translations")(App);