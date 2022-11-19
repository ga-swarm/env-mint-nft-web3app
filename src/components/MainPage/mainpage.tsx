
import React from 'react';

import icon_onb_1     from '../../static/pics/onb-1.png';
import icon_onb_1_mob from '../../static/pics/onb-1-mob.png';
import icon_onb_2     from '../../static/pics/onb-2.png';
import icon_onb_2_mob from '../../static/pics/onb-2-mob.png';
import icon_bg_onb    from "../../static/pics/bg/bg-onb.svg"

import { withTranslation }  from "react-i18next";
import {
	Link,
	withRouter,
	match,
	Redirect
} from 'react-router-dom';
import {
	History,
	Location
} from 'history';
import {
	gotoListResolve,
} from '../../reducers';

type MainPageProps = {
	store   : any,
	t       : any;
	match   : match;
	location: Location,
	history : History,
}
type MainPageState = {
	redirectToList: boolean,
}

class MainPage extends React.Component<MainPageProps, MainPageState> {

	store       : any;
	unsubscribe!: Function;
	t           : any;

	constructor(props: MainPageProps) {
		super(props);

		this.store = props.store;
		this.state = {
			redirectToList: false,
		};
		this.t     = this.props.t;
	}

	componentDidMount() {
		this.unsubscribe = this.store.subscribe(() => {
			if ( this.store.getState().gotoListRequested ) {
				this.store.dispatch(gotoListResolve());
				this.setState({ redirectToList: true });
			}
		});
 	}
	componentWillUnmount() { this.unsubscribe(); }

	render() {

		if ( this.state.redirectToList ) {
			return <Redirect to="/list" />
		}

		return (
			<main className="s-main">
				<section className="onb-intro">
					<img className="onb-bg" src={ icon_bg_onb } alt="" />
					<div className="container">
						<picture className="onb-intro__img">
							<source srcSet={ icon_onb_1 } media="(min-width: 1024px)" />
							<img src={ icon_onb_1_mob } alt="" />
						</picture>
						<div className="onb-intro__text">
							<h1 className="h1">{this.t('Add')} <span className="text-grad">{this.t('additional')}</span> {this.t('parameters for your nft, such as royalties and collateral.')}</h1>
							<p>{this.t('Keep valuables, earn on resale or just unwrap collateral')}</p>
							<a
								className="btn"
								href="https://appv1.envelop.is/list"
							>{this.t('Wrap NFT')}</a>
						</div>
					</div>
				</section>
				<div className="divider left"></div>
				<section className="onb-wrap">
					<div className="container">
						<div className="onb-wrap__text">
							<h2 className="h2">{this.t('NIFTSY Collateral Smart Contract Journey')}</h2>
							<p>{ this.t('You can create an NFT on ENVELOP, wrap it with collateral and sell. The transfer will be registered by the oracle, and the protocol will put a share of the money paid on the transfer into the wrapped collateral, elevating the NFT’s value.') }</p>
						</div>
						<div className="onb-wrap__img">
							<picture>
								<source srcSet={ icon_onb_2 } media="(min-width: 1024px)" />
								<img src={ icon_onb_2_mob } alt="" />
							</picture>
						</div>
					</div>
				</section>
			</main>
		)
	}
}

export default withTranslation("translations")(withRouter(MainPage));