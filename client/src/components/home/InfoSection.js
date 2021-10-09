import React, { Component } from 'react';
import './InfoSection.css';
import infoService from '../../services/infoService';
import ReactQuill from 'react-quill';
import './InfoSectionQuill.css'; // ES6

class InfoSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			content: props.content,
			id: props.id,
		};
	}
	componentDidMount() {
		//this.loadSection()
	}
	async loadSection() {
		const info = await infoService.getData(this.props.id, this.props.langCode);
		this.setState({ ...info });
		console.log('loaded info', info);
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}
	render() {
		const { content } = this.state;
		if (!content) return null;
		return (
			<ReactQuill
				id='info-section'
				className={'info-section-content'}
				defaultValue={content}
				readOnly={true}
				theme='bubble'
			/>
		);
	}
}

export default InfoSection;
