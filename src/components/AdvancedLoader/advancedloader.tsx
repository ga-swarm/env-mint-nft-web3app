
import React               from 'react';
import { withTranslation } from "react-i18next";

import {
	AdvancedLoaderStageType,
	AdvancedLoaderType,
	_AdvancedLoadingStatus
} from '../../reducers';

import i_loader_orange from "../../static/pics/loader-orange.svg"

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type AdvancedLoaderProps = {
	data: AdvancedLoaderType
}
type AdvancedLoaderState = {
}

class AdvancedLoader extends React.Component<AdvancedLoaderProps, AdvancedLoaderState> {

	constructor(props: AdvancedLoaderProps) {
		super(props);

		this.state = {
		}
	}

	getStageRow(item: AdvancedLoaderStageType) {
		if ( item.status === _AdvancedLoadingStatus.queued ) {
			return (
				<div
					key={item.id}
					className="c-approve__step in-queue"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<React.Fragment>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
									</React.Fragment>
								)
								: null
							}
							<span className="ml-2">
								{ item.text }
								<span className="dots">...</span>
							</span>
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1"> </div>
					</div>
				</div>
			)
		}

		if ( item.status === _AdvancedLoadingStatus.loading ) {
			return (
				<div
					key={item.id}
					className="c-approve__step active"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<React.Fragment>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
									</React.Fragment>
								)
								: null
							}
							<span className="ml-2">
								{ item.text }
								<span className="dots">...</span>
							</span>
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1">
							<div className="status">
								<img className="loader" src={ i_loader_orange } alt="" />
							</div>
						</div>
					</div>
				</div>
			)
		}
		if ( item.status === _AdvancedLoadingStatus.complete ) {
			return (
				<div
					key={item.id}
					className="c-approve__step completed"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<React.Fragment>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
									</React.Fragment>
								)
								: null
							}
							{ item.text }
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1">
							<div className="status">
								<b className="text-green">Completed</b>
							</div>
						</div>
					</div>
				</div>
			)
		}
	}

	render() {
		if ( !this.props.data.stages.length ) { return null; }

		return (
			<div className="modal">
				<div className="modal__inner">
					<div className="modal__bg"></div>
					<div className="container">
						<div className="modal__content">

							<div className="modal__header">
								<div className="h2">{ this.props.data.title }</div>
							</div>

							<div className="c-approve">
								{
									this.props.data.stages
										.sort((item, prev) => { return item.sortOrder - prev.sortOrder })
										.map((item) => { return this.getStageRow(item) })
								}
							</div>

						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default withTranslation("translations")(AdvancedLoader);