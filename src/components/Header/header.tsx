
import React                from 'react';
import Blockies             from 'react-blockies';
import { CopyToClipboard }  from 'react-copy-to-clipboard';
import Tippy                from '@tippyjs/react';
import {
	compactString,
	tokenToFloat
} from '../../models/_utils';
import {
	ChainParamsType,
	MetamaskAdapter,
} from '../../models/BlockchainAdapter';
import {
	clearError,
	requestChain,
	unsetAuthMethod,
	unsetLoading,
} from '../../reducers';
import {
	Link,
	withRouter,
	match
} from 'react-router-dom';
import {
	History,
	Location
} from 'history';

import icon_logo            from '../../static/pics/logo.svg';
import icon_logo_mob        from '../../static/pics/logo-mob.svg';
import icon_i_copy          from '../../static/pics/i-copy.svg';
import icon_i_arrow_down    from '../../static/pics/icons/i-arrow-down.svg';

import { withTranslation } from "react-i18next";

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type HeaderProps = {
	store                 : any,
	metamaskAdapter       : MetamaskAdapter,
	showAuthMethodSelector: Function,
	t                     : any,
	match                 : match;
	location              : Location,
	history               : History,
}
type HeaderState = {
	address            : string,
	metamaskLogged     : boolean,
	isTestNetwork      : boolean,
	currentChain       : number,
	chainName          : string,
	chainColorCode     : string,
	availableChains    : Array<ChainParamsType>,
	chainSelectorOpened: boolean,

	balanceNative : BigNumber,
	decimalsNative: number,
	symbolNative  : string,

	balanceERC20  : BigNumber,
	decimalsERC20 : number,
	allowanceERC20: BigNumber,
	symbolERC20   : string,

	copiedHint: boolean,

	versionMenuOpened: boolean,
	chainMenuOpened  : boolean,
	userMenuOpened   : boolean,
	cursorOnUserMenu : boolean,
}

class Header extends React.Component<HeaderProps, HeaderState> {

	store                 : any;
	metamaskAdapter       : MetamaskAdapter;
	unsubscribe!          : Function;
	unlisten!             : Function;
	showAuthMethodSelector: Function;
	t                     : any;

	versionMenuBlockRef   : React.RefObject<HTMLInputElement>;
	chainMenuBlockRef     : React.RefObject<HTMLInputElement>;
	userMenuBlockRef      : React.RefObject<HTMLInputElement>;

	constructor(props: HeaderProps) {
		super(props);

		this.store                  = props.store;
		this.metamaskAdapter        = props.metamaskAdapter;
		this.showAuthMethodSelector = props.showAuthMethodSelector;
		this.t                      = props.t;

		this.versionMenuBlockRef    = React.createRef();
		this.chainMenuBlockRef      = React.createRef();
		this.userMenuBlockRef       = React.createRef();

		// const urlParams = queryString.parse(this.props.location.search);
		// if ( urlParams.chain ) {
		// 	this.store.dispatch(requestChain( parseInt(`${urlParams.chain}`) ));
		// }

		this.state = {
			address            : '',
			metamaskLogged     : false,
			isTestNetwork      : this.store.getState().metamaskAdapter.isTestNetwork,
			currentChain       : this.store.getState().metamaskAdapter.chainId,
			chainName          : this.store.getState().metamaskAdapter.chainName,
			chainColorCode     : this.store.getState().metamaskAdapter.chainColorCode,
			availableChains    : this.store.getState().metamaskAdapter.availableChains,
			chainSelectorOpened: false,

			balanceNative : this.store.getState().account.balanceNative,
			decimalsNative: this.store.getState().metamaskAdapter.networkTokenDecimals,
			symbolNative  : this.store.getState().metamaskAdapter.networkTokenTicket,

			balanceERC20  : new BigNumber(0),
			decimalsERC20 : 0,
			allowanceERC20: new BigNumber(0),
			symbolERC20   : '',

			copiedHint       : false,
			versionMenuOpened: false,
			chainMenuOpened  : false,
			userMenuOpened   : false,
			cursorOnUserMenu : false,
		};
	}

	componentDidMount() {
		this.unsubscribe = this.store.subscribe(() => {
			this.setState({
				address        : this.store.getState().account.address,
				metamaskLogged : this.store.getState().metamaskAdapter.logged,
				isTestNetwork  : this.store.getState().metamaskAdapter.isTestNetwork,
				currentChain   : this.store.getState().metamaskAdapter.chainId,
				chainName      : this.store.getState().metamaskAdapter.chainName,
				chainColorCode : this.store.getState().metamaskAdapter.chainColorCode,
				availableChains: this.store.getState().metamaskAdapter.availableChains,

				balanceNative : this.store.getState().account.balanceNative,
				decimalsNative: this.store.getState().metamaskAdapter.networkTokenDecimals,
				symbolNative  : this.store.getState().metamaskAdapter.networkTokenTicket,

				balanceERC20  : this.store.getState().erc20TechTokenParams.balance,
				decimalsERC20 : this.store.getState().erc20TechTokenParams.decimals,
				allowanceERC20: this.store.getState().erc20TechTokenParams.allowance,
				symbolERC20   : this.store.getState().erc20TechTokenParams.symbol,
			});
		});
		// this.unlisten = this.props.history.listen(() => {
		// 	const urlParams = queryString.parse(this.props.location.search);
		// 	if ( urlParams.chain ) {
		// 		this.store.dispatch(requestChain( parseInt(`${urlParams.chain}`) ));
		// 	}
		// });
 	}
	componentWillUnmount() { this.unsubscribe(); }

	getLogo() {
		if ( this.state.metamaskLogged ) {
			return (
				<React.Fragment>
					<Link
						to="/list"
						className="s-header__logo d-none d-sm-block"
					>
						<img src={ icon_logo } alt="ENVELOP" />
					</Link>
					<Link
						to="/list"
						className="s-header__logo mob d-sm-none"
					>
						<img src={ icon_logo_mob } alt="ENVELOP" />
					</Link>
				</React.Fragment>
			)
		} else {
			return (
				<React.Fragment>
					<Link
						to="/"
						className="s-header__logo d-none d-sm-block"
					>
						<img src={ icon_logo } alt="ENVELOP" />
					</Link>
					<Link
						to="/"
						className="s-header__logo mob d-sm-none"
					>
						<img src={ icon_logo_mob } alt="ENVELOP" />
					</Link>
				</React.Fragment>
			)
		}
	}
	getVersionBlock() {
		const closeVersionMenu = () => {
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = null;
			this.setState({ versionMenuOpened: false });
		}
		const openVersionMenu = () => {
			setTimeout(() => {
				const body = document.querySelector('body');
				if ( !body ) { return; }
				body.onclick = (e: any) => {
					if ( !this.versionMenuBlockRef.current ) { return; }
					if ( e.path && e.path.includes(this.versionMenuBlockRef.current) ) { return; }
					closeVersionMenu();
				};
			}, 100);
			this.setState({ versionMenuOpened: true });
		}
		return (
			<div
				className="s-header__version"
				ref={ this.versionMenuBlockRef }
				onMouseLeave={ closeVersionMenu }
			>
				<button
					className={ `btn btn-sm btn-gray ${ this.state.versionMenuOpened ? 'active' : '' }` }
					onClick={ openVersionMenu }
					onMouseEnter={ openVersionMenu }
				>
					<span>v.1.0</span>
					<img className="arrow" src={ icon_i_arrow_down } alt="" />
				</button>
				{
					this.state.versionMenuOpened ?
					(
						<div className="btn-dropdown">
							<ul>
								<li>
									<button onClick={() => { window.location.href = 'https://app.envelop.is' }} className="item">v.0</button>
								</li>
								<li>
									<button className="item">v.1.0</button>
								</li>
							</ul>
						</div>
					) : null
				}
			</div>
		)
	}
	getChainSelectorDropdown() {
		if ( !this.state.chainMenuOpened ) { return null; }

		return (
			<div className="btn-dropdown">
			<ul>
				{
					this.state.availableChains.map((item) => {
						return (
							<li key={ item.chainId }>
								<button
									className={`item ${item.isTestNetwork ? 'testnet' : ''}`}
									onClick={() => { this.store.dispatch(requestChain(item.chainId)) }}
								>
									<span className="logo" style={{ backgroundColor: `#${item.chainColorCode}` }}></span>
									<span className="name">{ `${item.chainName} ${item.isTestNetwork ? 'Testnet' : ''}` }</span>
								</button>
							</li>
						)
					})
				}
			</ul>
			</div>
		)
	}
	getChainSelector() {

		if ( !this.state.metamaskLogged ) { return null; }

		const closeChainMenu = () => {
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = null;
			this.setState({ chainMenuOpened: false });
		}
		const openChainMenu = () => {
			setTimeout(() => {
				const body = document.querySelector('body');
				if ( !body ) { return; }
				body.onclick = (e: any) => {
					if ( !this.chainMenuBlockRef.current ) { return; }
					if ( e.path && e.path.includes(this.chainMenuBlockRef.current) ) { return; }
					closeChainMenu();
				};
			}, 100);
			this.setState({ chainMenuOpened: true });
		}
		return (
			<div
				className={`s-header__network ${ this.state.isTestNetwork ? 'test-network' : ''}`}
				ref={ this.chainMenuBlockRef }
				onMouseLeave={ closeChainMenu }
			>
				<button
					className={ `btn btn-sm btn-gray btn-network ${ this.state.chainMenuOpened ? 'active' : '' }`}
					onClick={ openChainMenu }
					onMouseEnter={ openChainMenu }
				>
					<span className="logo" style={{ backgroundColor: `#${this.state.chainColorCode}` }}></span>
					<span className="name">{ `${this.state.chainName} ${this.state.isTestNetwork ? 'Testnet' : ''}` }</span>
					<img className="arrow" src={ icon_i_arrow_down } alt="" />
				</button>

				{ this.getChainSelectorDropdown() }
			</div>
		)
	}
	getBalancesFull() {
		const balances = [];
		// if ( !this.state.balanceERC20.eq(0) && this.state.decimalsERC20 ) {
		// 	balances.push(`${ tokenToFloat(new BigNumber(this.state.balanceERC20), this.state.decimalsERC20).toFixed(3, BigNumber.ROUND_DOWN)} ${ this.state.symbolERC20 }`)
		// }

		if ( this.state.decimalsNative ) {
			balances.push(`${ tokenToFloat(new BigNumber(this.state.balanceNative), this.state.decimalsNative) } ${ this.state.symbolNative }`)
		}
		return (
			<div className="info">
				{ balances.join(', ') }
			</div>
		)
	}
	getBalancesShort() {
		const balances = [];
		// if ( !this.state.balanceERC20.eq(0) && this.state.decimalsERC20 ) {
		// 	balances.push(`${ tokenToFloat(new BigNumber(this.state.balanceERC20), this.state.decimalsERC20).toFixed(3, BigNumber.ROUND_DOWN)} ${ this.state.symbolERC20 }`)
		// }

		if ( this.state.decimalsNative ) {
			balances.push(`${ tokenToFloat(new BigNumber(this.state.balanceNative), this.state.decimalsNative).toFixed(3, BigNumber.ROUND_DOWN) } ${ this.state.symbolNative }`)
		}
		return (
			<div className="info">
				{ balances.join(', ') }
			</div>
		)
	}
	getConnectBtn() {
		return (
			<button
				className="btn btn-connect"
				onClick={(e) => {
					this.store.dispatch(unsetLoading());
					this.store.dispatch(clearError());
					this.store.dispatch(unsetAuthMethod());

					this.showAuthMethodSelector();
				}}
			>
				{ this.t('Connect') }
				<span className="d-none d-md-inline">&nbsp;{ this.t('Wallet') }</span>
			</button>
		)
	}
	getBalanceBlock() {
		return (
			<Tippy
				content={ this.getBalancesFull() }
				appendTo={ document.getElementsByClassName("wrapper")[0] }
				trigger='mouseenter'
				interactive={ false }
				arrow={ false }
				maxWidth={ 512 }
			>
				<div className="info">{ this.getBalancesShort() }</div>
			</Tippy>
		)
	}
	getAddressBlock() {
		return (
			<CopyToClipboard
				text={ this.state.address }
				onCopy={() => {
					this.setState({ copiedHint: true });
					setTimeout(() => { this.setState({ copiedHint: false }); }, 5*1000);
				}}
			>
				<button className="btn-copy">
					<Tippy
						content={ this.state.address ? this.state.address : '' }
						appendTo={ document.getElementsByClassName("wrapper")[0] }
						trigger='mouseenter'
						interactive={ false }
						arrow={ false }
						maxWidth={ 512 }
					>
						<span>{ this.state.address ? compactString(this.state.address) : '' }</span>
					</Tippy>
					<img src={ icon_i_copy } alt="" />
					<span className="btn-action-info" style={{display: this.state.copiedHint ? 'block' : 'none' }}>{ this.t('Copied') }</span>
				</button>
			</CopyToClipboard>
		)
	}
	closeUserMenu = () => {
		setTimeout(() => {
			if ( this.state.cursorOnUserMenu ) { return; }
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = null;
			this.setState({ userMenuOpened: false });
		}, 100);
	}
	openUserMenu = () => {
		setTimeout(() => {
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = (e: any) => {
				if ( !this.userMenuBlockRef.current ) { return; }
				if ( e.path && e.path.includes(this.userMenuBlockRef.current) ) { return; }
				this.closeUserMenu();
			};
		}, 100);
		this.setState({ userMenuOpened: true });
	}
	getAvatarBlock() {
		return (
			<div
				className="s-user__avatar"
				onClick={ this.openUserMenu }
				onMouseEnter={ this.openUserMenu }
				onMouseLeave={ this.closeUserMenu }
			>
				<div className="img">
					{/* <img src="../pics/avatar.svg" alt="" /> */}
					<Blockies
						seed      = { this.state.address }
						size      = {5}
						scale     = {10}
						color     = "#141616"
						bgColor   = "#4afebf"
						spotColor = "#ffffff"
					/>
				</div>
			</div>
		)
	}
	getUserMenu() {
		if ( !this.state.userMenuOpened ) { return; }

		return (
			<div
				className="s-header__menu"
				onMouseEnter={ () => {
					this.setState({ cursorOnUserMenu: true });
					this.openUserMenu();
				}}
				onMouseLeave={ () => {
					this.setState({ cursorOnUserMenu: false });
					this.closeUserMenu();
				}}
			>
				<ul className="inner pt-md-2">
					<li className="d-md-none">
						<div className="item address">
							<button className="btn-copy">
								<span>{ this.state.address ? compactString(this.state.address) : '' }</span>
								<img src={ icon_i_copy } alt="" />
								<span className="btn-action-info" style={{ display: this.state.copiedHint ? 'block' : 'none' }}>{ this.t('Copied') }</span>
							</button>
						</div>
					</li>
					<li>
						<a href="https://appv1.envelop.is/list" className="item">{ this.t('Dashboard') }</a>
					</li>
					<li>
						<a href="https://appv1.envelop.is/crossings" className="item">{ this.t('My crossings') }</a>
					</li>
					<li>
						<a className="item" href="https://appv1.envelop.is/royalty">{ this.t('My Royalties') }</a>
					</li>
					<li>
						<Link className="item" to="/mint">{ this.t('Mint') }</Link>
					</li>
					<li>
						<a className="item" href="https://appv1.envelop.is/saft">{ this.t('SAFT') }</a>
					</li>
					<li className="mt-md-2">
						<button
							onClick={(e) => {
								localStorage.removeItem('provider_type');
								window.location.reload();
							}}
							className="item disconnect"
						>{ this.t('Disconnect') }</button>
					</li>
				</ul>
			</div>
		)
	}
	getUserData() {
		return (
			<React.Fragment>
				<div
					className="s-user"
					ref={ this.userMenuBlockRef }
				>
					<div className="s-user__data d-none d-md-block">
						{ this.getBalanceBlock() }
						{ this.getAddressBlock() }
					</div>
					{ this.getAvatarBlock() }
				</div>
				{ this.getUserMenu() }
			</React.Fragment>
		)
	}
	getBtnOrData() {
		if ( !this.state.metamaskLogged ) {
			return this.getConnectBtn()
		} else {
			return this.getUserData()
		}
	}

	render() {

		return (
			<header className="s-header">
				<div className="container">
					<div className="d-flex align-center">
						{ this.getLogo() }
						{ this.getVersionBlock() }

					</div>
					<div className="d-flex align-center">
						{ this.getChainSelector() }
						{ this.getBtnOrData() }
					</div>
				</div>
			</header>
		)
	}
}

export default withTranslation("translations")(withRouter(Header));