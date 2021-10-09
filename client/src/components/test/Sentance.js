import React, { Component } from 'react';
import './Sentance.scss';

class Sentance extends Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.handleClick = this.handleClick.bind(this)
		
	}
	componentDidMount() {
		
	}
	handleClick(e){

	}
	
	render() {
		const {
			text
		} = this.props;

		return (
				<div 
					id={'sentance'} 
					onMouseDown={this.handleClick}
				>
					{text}
				</div>

		);
	}
}

export default Sentance;
