import React, { Component } from 'react';
import './LanguagePopup.css';

class LangagePopup extends Component {
	constructor(props) {
		super(props);
		this.state = {
			lang: props.lang,
		};
	}
	onSelectLanguage(lang) {}
	render() {
		return (
			<div id='lang-popup'>
				<div id='lang-popup-box'>
					<div id='lang-popup-box-flags'>
						<span className=''>SELECT LANGUAGE</span>
						<br />
						<img className='lang-popup-flag' onClick={() => this.onSelectLanguage('fr')} src='img/fr_flag.gif' />
						<img onClick={() => this.onSelectLanguage('en')} className='lang-popup-flag' src='img/en_flag.gif' />
					</div>
				</div>
			</div>
		);
	}
}

export default LangagePopup;
