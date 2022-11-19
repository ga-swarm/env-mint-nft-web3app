
import React from 'react';
import {
	withRouter,
	match,
} from 'react-router-dom';

import {
	History,
	Location
} from 'history';
import {
	withTranslation
} from "react-i18next";

import bg_lg_left_1  from '../../static/pics/bg/bg-lg-left-1.svg';
import bg_lg_right_4 from '../../static/pics/bg/bg-lg-right-4.svg';

import youtube_icon  from '../../static/pics/socials/youtube.svg'
import inst_icon     from '../../static/pics/socials/in.svg'
import github_icon   from '../../static/pics/socials/github.svg'
import telegram_icon from '../../static/pics/socials/telegram.svg'
import cn_tele_icon  from '../../static/pics/socials/cn-telegram.svg'
import twitter_icon  from '../../static/pics/socials/twitter.svg'
import med_icon      from '../../static/pics/socials/m.svg'

type TokenListProps = {
	store                 : any,
	t                     : any,
	match                 : match;
	location              : Location,
	history               : History,
}
type TokenListState = {
}

class TokenList extends React.Component<TokenListProps, TokenListState> {

	store : any;
	t     : any;

	constructor(props: TokenListProps) {
		super(props);

		this.store = props.store;
		this.t     = props.t;

		this.state = {
		}
	}

	render() {
		return (
			<main className="s-main">
			<div className="sec-error">
				<img className="sec-bg bg-left d-none d-lg-block" src={ bg_lg_left_1 } alt="" />
				<img className="sec-bg bg-right d-none d-lg-block" src={ bg_lg_right_4 } alt=""/ >
				<div className="sec-error__text">
					<h1>{ this.t('ERROR 404') }</h1>
					<div className="h1_sub text-grad">{ this.t('PAGE NOT FOUND') }</div>
					<p>{ this.t('We couldn\'t find the page you\'re looking for.') }</p>
					<p className="actions">
						<a href="https://appv1.envelop.is">{ this.t('Return Home') }</a>
						<span>|</span>
						<a href="https://docs.envelop.is/" target="_blank" rel="noopener noreferrer">{ this.t('Documentation') }</a>
					</p>
					<ul className="socials d-lg-none">
						<li><a href="https://www.youtube.com/c/ENVELOP" target="_blank" rel="noopener noreferrer"><img src={ youtube_icon } alt="ENVELOP. NFTs YouTube Channel" /></a></li>
						<li><a href="https://www.linkedin.com/company/niftsy" target="_blank" rel="noopener noreferrer"><img src={ inst_icon } alt="NIFTSY is token" /></a></li>
						<li><a href="https://github.com/niftsy/niftsysmarts" target="_blank" rel="noopener noreferrer"><img src={ github_icon } alt="Github of our NFT project" /></a></li>
						<li><a href="https://t.me/envelop_en" target="_blank" rel="noopener noreferrer"><img src={ telegram_icon }alt="ENVELOP telegram group" /></a></li>
						<li><a href="https://t.me/envelop_cn" target="_blank" rel="noopener noreferrer"><img src={ cn_tele_icon } alt="ENVELOP telegram group (China)" /></a></li>
						<li><a href="https://twitter.com/Envelop_project" target="_blank" rel="noopener noreferrer"><img src={ twitter_icon } alt="Our twitter" /></a></li>
						<li><a href="https://envelop.medium.com/" target="_blank" rel="noopener noreferrer"><img src={ med_icon } alt="Blog about Web 3.0" /></a></li>
					</ul>
				</div>
			</div>
			</main>
		)
	}
}

export default withTranslation("translations")(withRouter(TokenList));