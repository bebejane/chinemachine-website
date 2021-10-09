import React, { Component } from 'react';
import './InfoSection.css';
import Checkbox from '../util/Checkbox';
import Button from '../util/Button';
import Modal from './Modal';
import Loader from '../util/Loader';

import infoService from '../../services/infoService';
import sectionService from '../../services/sectionService';
import LanguageSelector from './LanguageSelector';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // ES6

class InfoSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			name: props.name,
			_name: undefined,
			section: {},
			html: '',
			content: {},
			changed: false,
			showSaveModal: false,
			changeLangCode: null,
			loading: true,
			saving: false,
		};
		this.handleChange = this.handleChange.bind(this);
	}
	componentDidMount() {
		this.loadSection();
	}
	async loadSection() {
		this.setState({ loading: true });
		try {
			const section = (await sectionService.getSectionData(this.props.id, this.props.langCode)) || {};
			this.setState({
				section: {
					...section,
					sectionId: this.props.id,
					langCode: this.props.langCode,
				},
				loading: false,
			});
			console.log('loaded');
		} catch (err) {
			this.props.onError(err);
		}
		this.setState({ loading: false });
	}

	async handleSaveSection(e) {
		if (e) e.preventDefault();
		this.setState({ saving: true });
		const { section } = this.state;
		try {
			const newSection = !section._id ? await infoService.add(section) : await infoService.update(section._id, section);
			this.setState({ section: newSection });
			console.log('saved section', newSection);
		} catch (err) {
			this.props.onError(err);
		}
		this.handleEndSaveSection();
		this.setState({ saving: false });
	}
	handleEndSaveSection() {
		const { changeLangCode } = this.state;
		this.setState({
			showSaveModal: false,
			changeLangCode: null,
			changed: false,
			saving: false,
		});
		if (changeLangCode) this.props.onChangeLanguage(changeLangCode);
	}
	handleChange(html, content, source, editor) {
		const section = {
			...this.state.section,
			html,
			content: editor.getContents(),
		};
		this.setState({ section, changed: true });
	}
	handleHeaderChange(header) {
		const section = { ...this.state.section, header };
		this.setState({ section, changed: true });
	}
	handleActiveChange(active) {
		const section = { ...this.state.section, active };
		this.setState({ section, changed: true });
	}
	handleChangeLanguage(langCode) {
		const { changed } = this.state;
		if (changed) return this.setState({ showSaveModal: true, changeLangCode: langCode });

		this.props.onChangeLanguage(langCode);
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}
	render() {
		const { langCode, languages } = this.props;
		const { section, showSaveModal, loading, saving, changed } = this.state;

		return (
			<form id='dash-info-form' onSubmit={(e) => this.saveSection(e)}>
				<div id='dash-info-section'>
					<input
						id={'header'}
						className={'dash-info-header-input'}
						type='text'
						placeholder={'Header...'}
						value={section.header || ''}
						onChange={(e) => this.handleHeaderChange(e.target.value)}
					/>
					<div id='dash-info-section-editor-wrap'>
						{!loading && (
							<ReactQuill id='quill-editor' defaultValue={section.content || ' '} onChange={this.handleChange} />
						)}
					</div>
					<div id='dash-info-section-bottom'>
						<div>
							<Button type={'submit'} loading={saving} onClick={(e) => this.handleSaveSection(e)} disabled={!changed}>
								SAVE
							</Button>
						</div>
						<LanguageSelector
							langCode={langCode}
							languages={languages}
							onChangeLanguage={(langCode) => this.handleChangeLanguage(langCode)}
						/>
					</div>
					<div id='dash-info-options'>
						<Checkbox
							id='active'
							checked={section.active || false}
							onChange={(checked) => this.handleActiveChange(checked)}
							label={'Expanded'}
						/>
					</div>
					{showSaveModal && (
						<Modal
							onConfirm={(e) => this.handleSaveSection(e)}
							onCancel={(e) => this.handleEndSaveSection(e)}
							message='Save changes?'
							header='Save'
							confirm='Save'
							cancel='Cancel'
						/>
					)}
					{loading && <Loader message={'Saving...'} />}
				</div>
			</form>
		);
	}
}
export default InfoSection;
