import React, { Component } from 'react';
import sectionService from '../../services/sectionService';
import Loader from '../util/Loader';

import './Content.css';

class Content extends Component {
	constructor(props) {
		super(props);
		this.state = {
			_name: props.name,
			name: props.name,
			loading: false,
		};
		this.handleChangeName = this.handleChangeName.bind(this);
		this.handleSubmitName = this.handleSubmitName.bind(this);
		this.contentRef = React.createRef();
	}
	componentDidMount() {}
	handleChangeName(e) {
		this.setState({ _name: e.target.value });
	}
	async handleSubmitName(e) {
		e.preventDefault();
		const { _name } = this.state;
		const { id } = this.props;

		this.setState({ loading: true });
		try {
			console.log('change name', _name);
			const section = await sectionService.update(id, { name: _name });
			this.props.onSectionChange(section);
		} catch (err) {
			this.props.onError(err);
		}
		this.setState({ loading: false });
	}
	static getDerivedStateFromProps(props, state) {
		if (state.id !== props.id) {
			return {
				...props,
				_name: props.name,
			};
		}
		return null;
	}
	componentDidUpdate(newProps) {
		if (newProps.id !== this.props.id) this.scrollToTop();
	}
	scrollToTop() {
		this.contentRef.current.scrollTo(0, 0);
	}
	render() {
		const { languages, langCode, Component, id, name } = this.props;

		const { _name, loading } = this.state;
		return (
			<div id='dash-content' ref={this.contentRef}>
				<div id='dash-content-header'>
					{name}
					{/*
          <form id='dash-content-name-form' onSubmit={this.handleSubmitName}>
              <input disable id='dash-content-name' type='text' value={_name } onChange={this.handleChangeName}/>
          </form>
          {loading && <Loader overlay={true} invert={true}/>}
          */}
					 <div id='dash-content-name-border'></div>
				</div>
				<div id='dash-content-wrap'>
					<Component
						id={id}
						key={id + langCode}
						name={name}
						languages={languages}
						langCode={langCode}
						onAddedSection={this.props.onAddedSection}
						onChangeLanguage={(langCode) => this.props.onChangeLanguage(langCode)}
						onDeleteSection={(id) => this.props.onDeleteSection(id)}
						onError={(err) => this.props.onError(err)}
					/>
				</div>
			</div>
		);
	}
}

export default Content;
