
import React               from 'react';
import { withTranslation } from "react-i18next";

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type SecretInputProps = {
	onChange    : (e: any) => void,
	inputClass? : string,
	readonly?   : boolean,
	disabled?   : boolean,
	value       : string,
	placeholder?: string,
}
type SecretInputState = {
	showPassword: boolean,
}

class SecretInput extends React.Component<SecretInputProps, SecretInputState> {

	constructor(props: SecretInputProps) {
		super(props);

		this.state = {
			showPassword: false
		}
	}

	render() {

		let clazz = `input-control ${this.props.inputClass || ''}`;

		return (
			<div
				className={`pin-group ${this.state.showPassword ? 'is-visible' : ''}`}
			>
				<input
					className={ clazz }
					type={ this.state.showPassword ? 'text' : 'password' }
					placeholder={ this.props.placeholder || '' }
					value={ this.props.value }
					readOnly={ this.props.readonly || false }
					disabled={ this.props.disabled || false }
					onChange={ this.props.onChange }
				/>
				<button
					className="btn"
					onClick={() => {
						if ( this.props.disabled ) { return; }
						this.setState({ showPassword: !this.state.showPassword })
					}}
				></button>
			</div>
		)
	}
}

export default withTranslation("translations")(SecretInput);