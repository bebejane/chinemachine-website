import React, { Component } from 'react';
import languageService from '../../services/languageService';
import Select from 'react-select';
import './LanguageSelector.css';

class LanguageSelector extends Component {
	constructor(props) {
		super(props);
		this.state = {
			languages: [],
		};
	}
	componentDidMount() {
		this.loadLanguages();
	}
	async loadLanguages() {
		try {
			const languages = await languageService.getAll();
			this.setState({ languages });
		} catch (error) {
			this.setState({ error });
		}
	}
	render() {
		const { langCode } = this.props;
		const { languages } = this.state;
		const options = languages.map((lang) => {
			return { value: lang.langCode, label: lang.name };
		});
		const selectedOption = options.filter((opt) => opt.value === langCode)[0];

		return (
			<div id='dash-language-selector'>
				<Select
					id={'dash-language-select'}
					menuPlacement='top'
					value={selectedOption}
					options={options}
					onChange={(opt) => this.props.onChangeLanguage(opt.value)}
				/>
			</div>
		);
	}
}
export default LanguageSelector;
