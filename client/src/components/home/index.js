import React, { Component } from 'react';
import './index.css';
import languageService from '../../services/languageService';
import homeService from '../../services/homeService';
import TopBar from './TopBar';
import BottomBar from './BottomBar';

const SHOP_SECTION = {
	_id: 'onlineshop',
	name: 'Online Shop',
	header: 'Online shop',
	type: 'onlineshop',
};
const FINDUS_SECTION = {
	_id: 'findus',
	name: 'Find us',
	header: 'Find us',
	type: 'findus',
};
class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			langCode: props.langCode,
			dict: {},
			languages: [],
			mainGallery: undefined,
			loading: true,
			sections: [],
			error: null,
			showBookAppointment: true,
		};
		this.handleError = this.handleError.bind(this);
		this.handleBrowse = this.handleBrowse.bind(this);
		this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
		this.handleBookAppointment = this.handleBookAppointment.bind(this);
		document.title = 'Chinemachine - Vintage · Buy · Sell · Trade · Paris';
	}

	componentDidMount() {
		this.handleChangeLanguage(this.state.langCode);
	}
	async handleChangeLanguage(langCode) {
		this.setState({ loading: true });
		try {
			if (langCode) await languageService.set(langCode);

			const home = await homeService.get();
			home.sections.push(FINDUS_SECTION);
			home.sections.push(SHOP_SECTION);
			home.sections = home.sections.filter((s) => (s.data ? !s.data.mainGallery : true));
			this.setState({
				langCode: home.langCode,
				languages: home.languages,
				dict: home.dictionary,
				sections: home.sections,
				mainGallery: home.mainGallery,
			});
			setTimeout(() => this.setState({ loading: false }), 0);
		} catch (error) {
			this.handleError(error);
		}
		this.setState({ loading: false });
	}
	handleBrowse(id) {
		const sections = this.state.sections.map((section) => {
			let isActive = section.active === undefined ? false : section.active;
			if (id === section._id) isActive = isActive ? false : true;
			else isActive = section.active;
			return {
				...section,
				active: isActive,
			};
		});
		this.setState({ sections });
	}
	handleBookAppointment(showBookAppointment) {
		this.setState({ showBookAppointment });
	}
	handleError(err) {
		const error = err.response && err.response.data ? err.response.data.message : err.message || err.toString();
		this.setState({ error });
	}
	render() {
		const { languages, langCode, dict, loading, sections, error } = this.state;

		if (loading) return null;
		if (error) {
			return (
				<div id='home-error'>
					<div>{error.toString()}</div>
					<div>Try reloading page!</div>
				</div>
			);
		}

		return (
			<div id='main'>
				<div id='wrapper'>
					<TopBar langCode={langCode} onChangeLanguage={this.handleChangeLanguage} dict={dict} />
					<BottomBar
						langCode={langCode}
						languages={languages}
						history={this.props.history}
						sections={sections}
						dict={dict}
						onBrowse={this.handleBrowse}
						onChangeLanguage={this.handleChangeLanguage}
						onBookAppointment={() => this.handleBookAppointment(true)}
						onError={this.handleError}
					/>
				</div>
			</div>
		);
	}
}

export default Home;
