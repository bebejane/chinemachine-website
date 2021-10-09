import React, { Component } from 'react';
import './TestButton.scss';
import Sentance from './Sentance'
const words = ['lover', 'baby', 'steamer', 'FLIR', 'red herring', 'chinemachine']

class TestButton extends Component {
	constructor(props) {
		super(props);
		this.state = {
			index:0,
			clicks:0,
			word:'',
			words:[],
			active:false,
			sentace:''
		};
		this.handleClick = this.handleClick.bind(this)
		this.handleFreeze = this.handleFreeze.bind(this)
	}
	async componentDidMount() {
		try{
			this.setState({words})
		}catch(err){

		}		
		this.interval = setInterval(()=>this.handleClick(), 600)
	}
	handleClick(e){
		if(e) clearInterval(this.interval)
		let {clicks, index, words} = this.state;
		let el = document.querySelector('div.test-button')
		clicks = clicks+1 > 10 ? 0 : clicks+1
		index = clicks === 10 ? index+1 : index
		if(index+1 > words.length){
			index = 0;
			clicks = 0;
		}
		el.innerHTML = clicks < 10 ? el.innerHTML.split('').sort((a,b)=> Math.random() > 0.5).join('')	: words[index]
		this.setState({index, clicks, word:words[index], active:true})
		setTimeout(()=>this.setState({active:false}), 100)

	}
	handleFreeze(e){
		let {sentace, index, clicks} = this.state;
		sentace += ' ' + document.querySelector('div.test-button').innerHTML
		this.setState({sentace, index:++index, clicks:0}, ()=>{
			this.handleClick()
		})
	}
	render() {
		const {
			word,
			active,
			clicks,
			sentace
		} = this.state;

		return (
			<React.Fragment>
				<div 
					className={'test-button click-' + clicks} 
					style={{color:active ? '#fff' : 'initial'}} 
					onMouseDown={this.handleFreeze}>
					{word}
				</div>
				<Sentance text={sentace}/>
			</React.Fragment>
		);
	}
}

export default TestButton;
