
import React               from 'react';
import { withTranslation } from "react-i18next";

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type InputWithOptionsProps = {
	onChange     : (e: any) => void,
	onKeyPress?  : (e: any) => void,
	onSelect?    : (e: any) => void,
	inputClass?  : string,
	blockClass?  : string,
	readonly?    : boolean,
	disabled?    : boolean,
	value        : string,
	placeholder? : string,
	options?     : Array<{
		label: string,
		value: string
	}>
}
type InputWithOptionsState = {
	listOpened: boolean,
}

class InputWithOptions extends React.Component<InputWithOptionsProps, InputWithOptionsState> {

	constructor(props: InputWithOptionsProps) {
		super(props);

		this.state = {
			listOpened: false,
		}
	}

	getOptions() {
		if ( !this.props.options || !this.props.onSelect || !this.props.options.length ) { return null; }
		if ( !this.state.listOpened ) { return null; }

		return (
			<ul className="options-list">
				{
					this.props.options.map((item) => {
						return (
							<li
								key={ item.value }
								className="option"
								onClick={() => {
									if ( this.props.onSelect ) {
										this.props.onSelect(item.value)
										this.setState({ listOpened: false })
									}
								}}
							>
								<div className="option-token">
									<span>{ item.label }</span>
								</div>
							</li>
						)
					})
				}
			</ul>
		)
	}

	render() {
		let inputClazz = `input-control no-arrow ${ this.props.inputClass || ''} ${ this.state.listOpened ? 'active' : '' }`;
		let blockClazz = `select-custom select-token`;

		return (
			<div className = { blockClazz }>
				<input
					className   = { inputClazz }
					type        = "text"
					placeholder = { this.props.placeholder || '' }
					value       = { this.props.value }
					readOnly    = { this.props.readonly    || false }
					disabled    = { this.props.disabled    || false }
					onChange    = { this.props.onChange }
					onKeyPress  = { this.props.onKeyPress }
					onFocus     = { () => {
						if ( !this.props.options || !this.props.onSelect || !this.props.options.length ) { return; }
						this.setState({ listOpened: true  })
					}}
					onBlur      = { () => {
						setTimeout(() => {
							this.setState({ listOpened: false })
						}, 200)
					}}
				/>
				{ this.getOptions() }
			</div>
		)
	}
}

export default withTranslation("translations")(InputWithOptions);