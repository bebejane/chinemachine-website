import React, { Component } from 'react';
import './SlottyRow.scss';

const random = (max = 10, min = 1) => {
	return (Math.floor(Math.random() * max) + min)
}

const scroll = (el, cb, hold) => {

	const ppi = (random()) + 60
	const inc = (random(6,1) * 0.1) + 0.20;
	const interval = 20
	const scrollHeight = el.scrollHeight;
	let curr = (random()*el.clientHeight);
	let timeout = null;
	el.scrollTop = curr;

	const scrollTo = (increment = 0) => {
		const pixels = (ppi - increment)
		if(pixels < 3)
			return finishScroll()
		timeout = setTimeout(()=>{
			curr += pixels;
			el.scrollTop = curr; 
			scrollTo(increment += inc)
		}, interval)	
		return timeout
	}

	const finishScroll = () => {
		const offset = el.scrollTop;
		const innerHeight = el.parentElement.clientHeight;
		const children = []
		for (const c of el.children[0].children)
			children.push(c)
		const winner = children.sort((a, b)=> Math.abs((a.offsetTop-offset) - (innerHeight/2)) > Math.abs((b.offsetTop-offset) - (innerHeight/2)))[0]
		winner.scrollIntoView({behavior: "smooth", block: "center"});
		timeout = setTimeout(()=>{
			cb(winner)
		}, 500)
	}
	const resetScroll = () => {
		clearTimeout(timeout)
		for (const c of el.children[0].children)
			c.classList.remove('slot-winner')
	}
	resetScroll()
	return scrollTo()
}

class SlottyRow extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hold:false
		};
		this.handleClick = this.handleClick.bind(this)
		this.id = 'slot' + Math.random()*10000000;
		this.height = 0
		this.width = 0
		this.innerHeight = 0
		this.timeout = null
		
	}
	componentDidMount() {
		this.calculateSize()
	}
	calculateSize(){
		const el = document.getElementById(this.id+'-wrap')
		this.innerHeight = el.parentElement.clientHeight;
		this.height = el.clientHeight;
		this.width = el.clientWidth;
	}
	handleClick(cb, hold){

		if(hold) return cb(this.winner)

		const el = document.getElementById(this.id)
		clearTimeout(this.timeout)
		this.timeout = scroll(el, (winner)=>{
			this.winner = winner;
			cb(winner)
		}, hold)
	}
	toggleHold(){
		this.setState({hold:!this.state.hold})
	}
	render() {
		let {
			children
		} = this.props;
		const {id, hold} = this.state;

		return (
				<div id={this.id} className={'slotty-row'}>	
					<div id={this.id + '-wrap'} className={'slotty-content'}>	
						{children}
					</div>
				</div>
		);
	}
}

export default SlottyRow;
