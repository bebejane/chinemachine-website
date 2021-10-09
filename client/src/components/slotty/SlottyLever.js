import React, { Component } from 'react';
import './SlottyRow.scss';

class SlottyLever extends Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.handleClick = this.handleClick.bind(this)
	}
	componentDidMount() {
		
	}
	calculateSize(){
		
	}
	handleClick(e){
		

	}

	render() {
		let {
			children
		} = this.props;
		const {id} = this.state;

		

		return (
				<div id='slotty-lever'>	
					<div onMouseDown={()=>this.props.onClick()}>slotty</div>
				</div>
		);
	}
}

export default SlottyLever;
