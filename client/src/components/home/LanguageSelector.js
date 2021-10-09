import React, { Component } from 'react';
import verificationService from '../../services/verificationService';
import './LanguageSelector.css';
import english from '../../images/flags/en.png';
import french from '../../images/flags/fr.png';

const flags = { en: english, fr: french };

class LangageSelector extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: undefined,
		};
		this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
	}
	async componentDidMount() {
		try {
			const user = await verificationService.getUser();
			this.setState({ user });
		} catch (err) {
			console.error(err);
		}
	}
	handleChangeLanguage(langCode) {
		this.props.onChangeLanguage(langCode);
	}
	render() {
		const { langCode, languages, dict } = this.props;
		const { user } = this.state;
		return (
			<div id='status-bar'>
				<div id='language-selector'>
					{languages.map((lang, idx) => (
						<img
							key={'flag' + idx}
							className={langCode === lang.langCode ? 'language-flag-selected' : 'language-flag'}
							src={flags[lang.langCode]}
							onClick={() => this.handleChangeLanguage(lang.langCode)}
							alt=''
						/>
					))}
				</div>
				<div id='status-login'>
					{user ? (
						<a href='/account'>{user.firstName + ' ' + user.lastName[0]}</a>
					) : (
						<a href='/verification/login?redirect=/account'>{dict.login}</a>
					)}
				</div>
			</div>
		);
	}
}
export default LangageSelector;
