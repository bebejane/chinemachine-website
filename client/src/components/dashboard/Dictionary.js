import React, { Component } from 'react';
import './Dictionary.css';
import Button from '../util/Button';
import Loader from '../util/Loader';
import LanguageSelector from './LanguageSelector';
import { GrFormClose } from 'react-icons/gr';

import languageService from '../../services/languageService';
import dictionaryService from '../../services/dictionaryService';

class Dictionary extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dictionary: undefined,
			langCode: props.langCode,
			languages: [],
			dictionaryTerm: '',
			saving: false,
		};
		this.handleFormChange = this.handleFormChange.bind(this);
	}
	componentDidMount() {
		this.loadDictionary();
	}
	async loadDictionary() {
		try {
			const languages = await languageService.getAll();
			const dictionary = await dictionaryService.getAll();
			this.setState({ dictionary, languages });
		} catch (err) {
			this.handleError(err);
		}
	}
	handleFormChange(event) {
		const { id, value } = event.target;
		this.setState({
			[id]: value.replace(/\s/g, ''),
		});
	}
	handleChangeLanguage(langCode) {
		this.setState({ langCode });
	}
	handleDictionaryChange(e, id, languageCode) {
		console.log(languageCode);
		const dictionary = this.state.dictionary.map((dict) => {
			if (dict._id === id) dict.language[languageCode] = e.target.value;
			return dict;
		});
		this.setState({ dictionary });
	}
	async addDictionaryTerm(e) {
		e.preventDefault();
		const { dictionaryTerm, dictionary } = this.state;
		try {
			this.setState({ saving: true });
			const newDict = await dictionaryService.add(dictionaryTerm);
			dictionary.push(newDict);
			this.setState({ dictionary, dictionaryTerm: '' });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	async deleteDictionaryTerm(id) {
		try {
			this.setState({ saving: true });
			await dictionaryService.delete(id);
			const dictionary = this.state.dictionary.filter((dict) => dict._id !== id);
			this.setState({ dictionary });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	async saveAll(e) {
		e.preventDefault();

		try {
			this.setState({ saving: true });
			const dictionary = this.state.dictionary;
			await dictionaryService.updateMany(dictionary);
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	handleError(err) {
		this.props.onError(err);
	}
	render() {
		const { dictionary, dictionaryTerm, languages, saving, langCode } = this.state;

		if (!dictionary) return <Loader />;

		return (
			<div id='dictionary'>
				<form id='translation-form' onSubmit={(e) => this.saveAll(e)}>
					<div id='dictionary-top'>
						<table id='dictionary-terms'>
							<tbody>
								{dictionary.map(({ _id, term, language }, idx) => (
									<React.Fragment key={'f-' + idx}>
										<tr key={'t' + idx} className={'dictionary-term'}>
											<td className={'dictionary-term-key'} colSpan={2}>
												{term}
											</td>
										</tr>
										<tr key={'t2' + idx} className={'dictionary-term'}>
											<td className={'dictionary-term-value'}>
												<input
													id={term}
													className={'dictionary-term-value-input'}
													type='text'
													value={language[langCode] || ''}
													onChange={(e) => this.handleDictionaryChange(e, _id, langCode)}
												/>
											</td>
											<td className={'dictionary-term-delete'}>
												<GrFormClose
													className={'dictionary-term-delete-icon'}
													onClick={(e) => this.deleteDictionaryTerm(_id)}
												/>
											</td>
										</tr>
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>
					<div id='dictionary-bottom'>
						<div id='dictionary-save'>
							<Button type='submit' loading={saving}>
								Save
							</Button>
						</div>
						<LanguageSelector
							langCode={langCode}
							languages={languages}
							onChangeLanguage={(langCode) => this.handleChangeLanguage(langCode)}
						/>
					</div>
				</form>
				<div id='dictionary-add'>
					<form id='add-term-form' onSubmit={(e) => this.addDictionaryTerm(e)}>
						<Button type='submit' loading={saving}>
							Add
						</Button>{' '}
						<input
							id='dictionaryTerm'
							type='text'
							placeholder='Key...'
							value={dictionaryTerm}
							onChange={this.handleFormChange}
						/>
					</form>
				</div>
			</div>
		);
	}
}

export default Dictionary;
