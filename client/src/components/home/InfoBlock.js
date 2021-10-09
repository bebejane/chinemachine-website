import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { GoChevronDown, GoChevronUp } from 'react-icons/go';
import './InfoBlock.css';

class InfoBlock extends Component {
	constructor(props) {
		super(props);
		this.state = {
			header: props.header,
			name: props.name,
			langCode: props.langCode,
			active: props.active,
			expand: props.expand,
		};
		this.contentRef = React.createRef();
	}
	onClick(e) {
		return;
		//if (!this.props.onActive) return
		//this.props.onActive(!this.state.active)
	}
	render() {
		const { id, active, header, noBorder } = this.props;

		return (
			<div className='info-block'>
				<div className={'info-block-border-top'}></div>
				<Link id={this.props.id} className='info-block-top' to={{ pathname: '/', state: { id } }} ref={this.contentRef}>
					<h2 className={active ? 'info-block-header-active' : 'info-block-header'}>{header}</h2>
					<div className='info-block-expand'>{active ? <GoChevronDown /> : <GoChevronUp />}</div>
				</Link>
				{active && <div className='info-block-content'>{this.props.children}</div>}
				{!noBorder && <div className={'info-block-border-bottom'}></div>}
			</div>
		);
	}
}
export default InfoBlock;
