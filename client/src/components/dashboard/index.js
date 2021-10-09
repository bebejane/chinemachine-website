import React, { Component } from 'react';
import './index.css';
import * as serviceWorker from '../../serviceWorker';

import { isAdministrator } from '../../util';
import arrayMove from 'array-move';
import verificationService from '../../services/verificationService';
import sectionService from '../../services/sectionService';

import { GrTextAlignFull, GrInstagram } from 'react-icons/gr';
import { MdTranslate } from 'react-icons/md';
import { BsImage, BsCalendar } from 'react-icons/bs';
import { SiEtsy } from 'react-icons/si';
import { BiStore, BiHome } from 'react-icons/bi';
import { GoPlus } from 'react-icons/go';
import { FaUserFriends } from 'react-icons/fa';

import Verification from '../verification';
import Loader from '../util/Loader';
import Modal from './Modal';
import Content from './Content';
import Nav from './Nav';

import HomeSection from './HomeSection';
import StoreInfoSection from './StoreInfoSection';
import Appointments from './Appointments';
import InfoSection from './InfoSection';
import GallerySection from './GallerySection';
import UserSection from './UserSection';
import CustomerSection from './CustomerSection';
import Dictionary from './Dictionary';
import Instagram from './Instagram';
import ShopSection from './ShopSection';
import AddNewSection from './AddNewSection';
import NoEditSection from './NoEditSection';

const HOME_SECTION = {
	_id: 'home',
	name: 'Home',
	component: HomeSection,
	icon: BiHome,
	admin: true,
};

const GENERAL_SECTIONS = [
	HOME_SECTION,
	{
		_id: 'appointments',
		name: 'Appointments',
		component: Appointments,
		icon: BsCalendar,
	},
	{
		name: 'Customers',
		_id: 'customers',
		component: CustomerSection,
		icon: FaUserFriends,
	},
	{
		name: 'Users',
		_id: 'users',
		component: UserSection,
		icon: FaUserFriends,
		admin: true,
	},
];

const OTHER_SECTIONS = [
	{
		name: 'Online Shop',
		_id: 'onlineShop',
		component: ShopSection,
		icon: SiEtsy,
		admin: true,
	},
	{
		_id: 'storeInfo',
		name: 'Store Info',
		component: StoreInfoSection,
		icon: BiStore,
		admin: true,
	},
	{
		name: 'Translations',
		_id: 'transltions',
		component: Dictionary,
		icon: MdTranslate,
		admin: true,
	},
	{
		name: 'Instagram',
		_id: 'instagram',
		component: Instagram,
		icon: GrInstagram,
		admin: true,
	},
];

const ADD_NEW_SECTION = {
	name: 'Add new',
	_id: 'addnewsection',
	component: AddNewSection,
	icon: GoPlus,
	noDelete: true,
};
const defaultSection = GENERAL_SECTIONS[0];

const defaultState = {
	user: undefined,
	component: NoEditSection,
	section: defaultSection,
	general: [...GENERAL_SECTIONS],
	other: [...OTHER_SECTIONS],
	sections: [],
	languages: [],
	langCode: 'en',
	showAddSectionModal: false,
	showDeleteSectionModal: false,
	showSoftwareUpdateModal: false,
	deleteSection: null,
	loading: true,
	error: null,
};

class Dashboard extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...defaultState,
		};
		this.handleNavigation = this.handleNavigation.bind(this);
		this.handleShowAddSection = this.handleShowAddSection.bind(this);
		this.handleAddedSection = this.handleAddedSection.bind(this);
		this.handleConfirmDeleteSection = this.handleConfirmDeleteSection.bind(this);
		this.handleCloseDeleteSectionModal = this.handleCloseDeleteSectionModal.bind(this);
		this.handleDeleteSection = this.handleDeleteSection.bind(this);
		this.handleCloseAddSection = this.handleCloseAddSection.bind(this);
		this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
		this.handleChangeName = this.handleChangeName.bind(this);
		this.handleOrderSection = this.handleOrderSection.bind(this);
		this.handleLogin = this.handleLogin.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
		this.handleError = this.handleError.bind(this);
		this.handleCloseErrorModal = this.handleCloseErrorModal.bind(this);
		this.handleSectionChange = this.handleSectionChange.bind(this);
		this.checkForSoftwareUpdates = this.checkForSoftwareUpdates.bind(this);
		this.handleSoftwareUpdateAvailable = this.handleSoftwareUpdateAvailable.bind(this);
		this.handleSoftwareUpdateInstalled = this.handleSoftwareUpdateInstalled.bind(this);

		this.loadSections = this.loadSections.bind(this);
	}
	async componentDidMount() {
		document.title = 'Chinemachine / Dashboard';
		this.setState({ loading: true });

		let user;
		try {
			user = await verificationService.getUser();
		} catch (err) {
			return this.handleLogout();
		}

		if (!user) return this.handleLogout();

		this.props.history.listen((event) => {
			if (!event.state || !event.state.sectionId) return;
			const { sectionId } = event.state;
			const { general, other, sections } = this.state;
			const section = sections
				.concat(general)
				.concat(other)
				.concat([ADD_NEW_SECTION])
				.filter((sec) => sec.id === sectionId || sec._id === sectionId)[0];
			this.setState({ section: section || HOME_SECTION });
		});

		serviceWorker.register({
			onUpdate: this.handleSoftwareUpdateAvailable,
			onSuccess: this.handleSoftwareUpdateInstalled,
		});

		this.checkForUpdatesInterval = setInterval(this.checkForSoftwareUpdates, 20000);
		if (!isAdministrator(user.role)) {
			defaultState.general = defaultState.general.filter((s) => !s.admin);
			defaultState.other = defaultState.other.filter((s) => !s.admin);
			defaultState.section = defaultState.general.filter((s) => s._id === 'appointments')[0];
		}

		this.setState({ ...defaultState, user }, async () => {
			if (isAdministrator(user.role)) await this.loadSections();
			const sectionId = this.props.location.pathname.replace(/\/dashboard/gi, '').replace('/', '');
			if (sectionId) this.handleNavigation(sectionId);

			this.setState({ loading: false });
		});
	}
	componentWillUnmount() {
		clearInterval(this.checkForUpdatesInterval);
	}
	handleNavigation(sectionId) {
		this.props.history.push({
			pathname: '/dashboard/' + sectionId,
			state: { sectionId },
		});
	}
	async loadSections() {
		try {
			const sections = await sectionService.getAll();
			sections.forEach((section) => {
				section = this.generateSection(section);
			});

			this.setState({ sections, loading: false });
		} catch (error) {
			this.handleError(error);
		}
	}
	generateSection(section) {
		section.icon = section.type === 'info' ? GrTextAlignFull : BsImage;
		section.header = section.type === 'info' ? 'Info' : 'Gallery';
		section.component = section.type === 'info' ? InfoSection : GallerySection;
		return section;
	}

	handleShowAddSection() {
		this.setState({ showAddSectionModal: true });
	}
	handleAddedSection(section) {
		const sections = this.state.sections;
		sections.push(this.generateSection(section));
		this.setState({ showAddSectionModal: false, sections, section });
	}
	handleConfirmDeleteSection(id) {
		const deleteSection = this.state.sections.filter((section) => section._id === id)[0];
		this.setState({ deleteSection, showDeleteSectionModal: true });
	}
	handleCloseDeleteSectionModal() {
		this.setState({ deleteSection: null, showDeleteSectionModal: false });
	}
	async handleDeleteSection(id) {
		this.handleCloseDeleteSectionModal();
		const section = this.state.sections.filter((section) => section._id === id)[0];
		const sections = this.state.sections.filter((section) => section._id !== id);
		if (!section) return;
		try {
			await sectionService.delete(section._id);
		} catch (err) {
			return this.handleError(err);
		}

		this.setState({ sections }, () => {
			this.handleNavigation(HOME_SECTION._id);
		});
	}
	handleSectionChange(section) {}
	handleCloseAddSection() {
		this.setState({ showAddSectionModal: false });
	}
	handleChangeLanguage(langCode) {
		this.setState({ langCode });
	}
	async handleChangeName(sectionId, name) {
		let { sections } = this.state;
		const section = sections.filter((s) => s._id === sectionId)[0];
		section.name = name;
		const updatedSection = await sectionService.update(section._id, section);
		sections = sections.map((sec) => (sec._id === updatedSection._id ? updatedSection : section));
		this.setState({ sections });
	}

	async handleOrderSection(oldIndex, newIndex) {
		const oldSections = [...this.state.sections];
		const sections = arrayMove(this.state.sections, oldIndex, newIndex);
		this.setState({ sections });

		try {
			const newSections = await sectionService.updateMany(
				sections.map((sec, idx) => {
					return { _id: sec._id, order: idx };
				})
			);
			newSections.forEach((section) => (section = this.generateSection(section)));
			this.setState({ sections: newSections });
		} catch (err) {
			this.setState({ sections: oldSections });
			this.handleError(err);
		}
	}
	handleLogin(user) {
		this.setState({ showLogin: false });
		this.componentDidMount();
	}
	async handleLogout() {
		//return
		this.setState({ loading: true, user: undefined });
		try {
			await verificationService.logout();
			this.props.history.push('/verification?redirect=/dashboard&error=Unauthorized access');
		} catch (err) {
			this.handleError(err);
		}
	}
	handleError(err) {
		//if(err && err.response && err.response.status === 401) return this.handleLogout()
		const error =
			err.response && err.response.data
				? err.response.data.message || err.response.data
				: err.message || err.toString();
		this.setState({ error });
	}
	handleCloseErrorModal() {
		console.log('close');
		this.setState({ error: null });
	}
	// Auto update
	handleSoftwareUpdateAvailable(registration) {
		console.log(' New software update ready');
		console.log(registration);
		this.setState({ showSoftwareUpdateModal: true });
	}
	async handleSoftwareUpdateInstalled(registration) {
		console.log('Software update installed, reload.');
		await navigator.serviceWorker
			.getRegistrations()
			.then(function (registrations) {
				for (let registration of registrations) registration.update();
				window.location.reload(true);
			})
			.catch((err) => this.handleError(err));
	}
	handleUpdateSoftware() {
		this.setState({ showSoftwareUpdateModal: false }, () => {
			this.handleSoftwareUpdateInstalled();
		});
	}
	handleCancelUpdateSoftware() {
		clearTimeout(this.softwareUpdateTimeout);
		this.setState({ showSoftwareUpdateModal: false });
		this.softwareUpdateTimeout = setTimeout(() => this.setState({ showSoftwareUpdateModal: true }), 1000 * 15);
	}
	checkForSoftwareUpdates() {
		if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return console.log('service worker not ready');

		navigator.serviceWorker.ready
			.then((registration) => {
				return registration.update().then(() => {});
			})
			.catch((err) => {
				this.handleError(err);
			});
	}

	render() {
		const {
			section,
			sections,
			general,
			other,
			languages,
			langCode,
			showDeleteSectionModal,
			showSoftwareUpdateModal,
			deleteSection,
			loading,
			error,
			showLogin,
			user,
		} = this.state;

		if (showLogin) return <Verification type='login' redirect='/dashboard' onLogin={this.handleLogin} />;

		if (loading) return <Loader error={error} onRetry={() => this.componentDidMount()} />;

		return (
			<div id='dashboard'>
				<Nav
					id={section._id}
					langCode={langCode}
					general={general}
					sections={sections}
					other={other}
					user={user}
					onClick={this.handleNavigation}
					onDeleteSection={this.handleConfirmDeleteSection}
					onOrderSection={this.handleOrderSection}
					onLogout={this.handleLogout}
					onError={this.handleError}
				/>
				<Content
					id={section.id || section._id}
					Component={section.component}
					header={section.header || section.name}
					name={section.name || ''}
					languages={languages}
					langCode={langCode}
					onAddedSection={this.handleAddedSection}
					onChangeLanguage={this.handleChangeLanguage}
					onChangName={this.handleChangeName}
					onDeleteSection={this.handleConfirmDeleteSection}
					onSectionChange={this.loadSections}
					onError={this.handleError}
				/>
				{showDeleteSectionModal && (
					<Modal
						header={'Delete'}
						confirm={'Delete'}
						message={'Delete section "' + deleteSection.name + '"?'}
						onConfirm={() => this.handleDeleteSection(deleteSection._id)}
						onCancel={this.handleCloseDeleteSectionModal}
					/>
				)}
				{showSoftwareUpdateModal && (
					<div id='software-update'>
						<Modal
							header={'Update'}
							confirm={'Yes!'}
							cancel={'laters'}
							message={'New update available. Restart now?'}
							onConfirm={() => this.handleUpdateSoftware()}
							onCancel={() => this.handleCancelUpdateSoftware()}
						/>
					</div>
				)}
				 {error && <Modal error={error} onCancel={this.handleCloseErrorModal} />}
			</div>
		);
	}
}

export default Dashboard;
