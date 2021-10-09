import React, { Component } from 'react';
import './index.scss';
import SlottyRow from './SlottyRow'
import SlottyLever from './SlottyLever'
import imageService from '../../services/imageService';
import verificationService from '../../services/verificationService';

const random = (max = 10, min = 1) => {
	return (Math.floor(Math.random() * max) + min)
}

let words = ['lover', 'baby', 'steamer', 'FLIR', 'red herring', 'chine machine', 'lover', 'baby', 'steamer', 'FLIR', 'red herring', 'chine machine', 'lover', 'baby', 'steamer', 'FLIR', 'red herring', 'chine machine']

class Slotty extends Component {
	constructor(props) {
		super(props);
		this.state = {
			match:false,
			playing:false,
			holds:{}
		}
		this.onStart = this.onStart.bind(this)
		
		for (var i = 0; i < 5; i++)
			words = words.concat(words)

		this.rows = [
			{elements:words.map((w, idx)=><div key={idx+'-1'} id={w} className='slot'>{w}</div>), ref:React.createRef()},
			{elements:words.map((w, idx)=><div key={idx+'-2'} id={w} className='slot'>{w}</div>), ref:React.createRef()},
			{elements:words.map((w, idx)=><div key={idx+'-3'} id={w} className='slot'>{w}</div>), ref:React.createRef()}
		]
	}
	async componentDidMount() {
		document.title = 'Chinemachine / Slotty';
		document.addEventListener('keydown', (e)=>{
			if(e.code === 'Space')
				this.onStart()
		})
	}
	onStart(){
		this.reset()
		const {holds} = this.state
		const delay = 100;
		const result = []
		this.setState({match:false, playing:true})

		this.rows.forEach((r, idx)=>{
			setTimeout(()=>r.ref.current.handleClick((el)=>{
				el.classList.add('slot-stopped')
				result.push(el)
				if(result.length === this.rows.length){
					const id = result[0].attributes.getNamedItem('id').value
					if(result.filter((r)=> r.attributes.getNamedItem('id').value == id).length === result.length)
						this.onMatch(id, result)
					this.setState({playing:false})
				}
			}, holds[idx]), random(100, 200))
		})
		
	}
	toggleHold(idx){
		const {holds} = this.state;
		holds[idx] = holds[idx] ? !holds[idx] : true
		this.setState({holds})
	}
	onMatch(id, result){
		result.forEach((el)=>{
			el.classList.remove('slot-stopped')
			el.classList.add('slot-winner')
			el.classList.add('blinker')
		})
		this.setState({match:id})
		
	}
	reset(){
		document.querySelectorAll('div.slot').forEach((slot)=>{
			slot.classList.remove('slot-stopped')
			slot.classList.remove('slot-winner')
			slot.classList.remove('blinker')
		})
		clearInterval(this.interval)
	}
	render() {
		const {
			match,
			holds,
			playing
		} = this.state;

		return (
			<React.Fragment>
				<div id='slotty'>
					<div id='slotty-rows'>
						{this.rows.map((r, idx)=>
							<SlottyRow key={idx} ref={r.ref}>
								{r.elements}
							</SlottyRow>	
						)}
						{/*<div className='center'><div></div></div>*/}
					</div>
					<div id='slotty-holds'>
						{this.rows.map((r, idx)=>
							<div 
								key={idx} 
								className={'slot-hold ' + (holds[idx] ? 'held' : '')} 
								onMouseDown={()=>this.toggleHold(idx)}
							>
								HOLD
							</div>
						)}
					</div>
					<div id='slotty-play'>
						<div 
							className={playing ? 'blinker' : ''}
							onMouseDown={()=>this.onStart()}
							disabled={playing}
						>PLAY</div>
					</div>
	 			</div>
	 			
 			</React.Fragment>
		);
	}
}

export default Slotty;
