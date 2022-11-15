
import icon_logo from "../../static/pics/logo.svg";
import { useTranslation } from 'react-i18next';

function Footer() {

	const { t } = useTranslation();

	return (
		<footer className="s-footer">
			<div className="container">
				<div className="row">
					<div className="col-12 col-md-auto">
						<div className="s-footer__logo">
							<img src={ icon_logo } alt="" />
						</div>
					</div>
					<div className="col-12 col-md-auto">
						<ul className="s-footer__menu">
							<li><a target="_blank" rel="noopener noreferrer"
								href="https://ido.envelop.is/">{ t('IDO') }</a></li>
							<li><a target="_blank" rel="noopener noreferrer"
								href="https://envelop.is/">{ t('Protocol') }</a></li>
							<li><a target="_blank" rel="noopener noreferrer"
								href="https://envelop.medium.com/nfts-market-meta-analysis-by-niftsy-e9f131234041">{ t('Analytics') }</a></li>
							<li><a target="_blank" rel="noopener noreferrer"
								href="https://ido.envelop.is/#team">{ t('Creators') }</a></li>
							<li><a target="_blank" rel="noopener noreferrer"
								href="https://t.me/envelop_en">{ t('Support') }</a></li>
						</ul>
					</div>
				</div>
			</div>
		</footer>
	)
}

export default Footer;