import React, { Component } from 'react';
import './Checkbox.css';

class Checkbox extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	handleChange() {
		const { checked } = this.props;
		this.setState({ checked: !checked });

		if (this.props.onChange) this.props.onChange(!checked);
	}
	static getDerivedStateFromProps(nextProps) {
		return nextProps;
	}
	render() {
		const { id, style, disabled, checked, label } = this.props;
		//console.log(id,checked,label)
		return (
			<div id={id} className='checkbox-wrap'>
				<div className='checkbox-check'>
					<input
						id={id}
						type='checkbox'
						className={'checkbox'}
						style={style || undefined}
						disabled={disabled || undefined}
						checked={checked}
						onClick={(e) => e.stopPropagation()}
						onChange={(e) => this.handleChange(e)}
					/>
				</div>
				{label && <div className='checkbox-label'>{label}</div>}
			</div>
		);
	}
}
export default Checkbox;
