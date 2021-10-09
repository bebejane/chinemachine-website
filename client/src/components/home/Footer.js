import React, { Component } from 'react';
import './Footer.css';
import VizSensor from 'react-visibility-sensor';

class Footer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			borders: 1,
		};
	}
	componentDidMount() {
		setTimeout(() => this.animate(), 3000);
	}
	componentWillUnmount() {
		clearInterval(this.animateInterval);
	}
	onBrowse(id) {}
	scrollIntoView(id) {
		const element = document.getElementById(id);
		if (!element) return;

		element.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		});
	}
	animate(run) {
		if (!run || this.animateInterval) return;

		let borders = this.state.borders;

		this.animateInterval = setInterval(() => {
			if (borders >= 120) clearInterval(this.animateInterval);
			else this.setState({ borders: ++borders });
		}, 0);
	}
	render() {
		const { borders } = this.state;
		let r = 125;
		let slogan = 'Feel the ride...';
		let fontSize = 5;

		const items = new Array(borders).fill(borders).map((el, idx) => {
			r -= idx / 5;
			fontSize += idx / 20;

			if (idx > 50) slogan = Math.random() > 0.7 ? 'CHINEMACHINE' : 'Feel the ride...';

			return (
				<div
					key={'b' + idx}
					className={'footer-border-' + (idx % 2 ? 'top' : 'bottom')}
					style={{
						//color: 'rgba('+r+','+g+','+b+')',
						transform: 'rotate(' + idx * 6 + 'deg)',
						fontSize: fontSize + 'px',
					}}
				>
					{slogan}
				</div>
			);
		});
		return (
			<VizSensor onChange={(isVisible) => this.animate(isVisible)}>
				<div id='footer'>
					<div id='footer-border-top'></div>
					<div id='footer-borders'>{items}</div>
				</div>
			</VizSensor>
		);
	}
}
export default Footer;
