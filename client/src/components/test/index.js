import React, { Component } from 'react';
import './index.scss';
import TestButton from './TestButton'


const sizes = {
	'X Small':576,
	'Small': 768,
	'Medium':992,
	'Large':1200
}

class Test extends Component {
	constructor(props) {
		super(props);
		this.state = {}
	}
	async componentDidMount() {
		document.title = 'Chinemachine / Test';
		window.addEventListener('resize', (e)=>{
			const w = document.body.clientWidth
			const size = Object.keys(sizes).sort((a,b)=> sizes[a] <= w )[0]
			document.getElementById('status').innerHTML = size + ' (' + sizes[size] + 'px / ' + w + 'px)'
		})
	}
	render() {
		const {
		} = this.state;

		return (
			<div id='test'>
				<div id='status'></div>
				<TestButton/>
 			</div>
		);
	}
}

export default Test;
