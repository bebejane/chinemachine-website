import React, { Component } from 'react';
import packageJson from '../../../package.json';
import { isAdministrator } from '../../util';
import NavSections from './NavSections';
import { GoPlus } from 'react-icons/go';
import { FiGlobe } from 'react-icons/fi';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import logo from '../../images/cm_drawbar.png';
import './Nav.css';

class Nav extends Component {
	constructor(props) {
		super(props);
		this.state = {
			active: undefined,
			hoverSection: null,
		};
	}
	onClick(sectionId) {
		this.setState({ active: false });
		this.props.onClick(sectionId);
	}
	drawBar(active) {
		this.setState({ active });
	}
	handleSectionHover(id, hover) {
		this.setState({ hoverSection: hover ? id : null });
	}
	handleDeleteSection(e, sectionId) {
		e.stopPropagation();
		this.props.onDeleteSection(sectionId);
	}
	render() {
		const { general, sections, other, id, user } = this.props;
		const { active } = this.state;

		if (!user) return null;

		return (
			<div id='dash-nav-wrap' className={!active ? 'dash-nav-wrap-inactive' : ''}>
				<div
					id='dash-nav-drawbar'
					className={
						active === false ? 'dash-nav-drawbar-inactive' : active === true ? 'dash-nav-drawbar-active' : undefined
					}
					onClick={(e) => this.drawBar(!active)}
				>
					<img id='dash-logo-image' src={logo} alt='Chinemachine' />
				</div>
				<div id='dash-nav' className={!active ? 'dash-nav-inactive' : undefined}>
					<div className='dash-nav-group'>
						{general.map((section, idx) => (
							<div
								key={idx}
								className={id === section._id ? 'dash-nav-section-selected' : 'dash-nav-section'}
								onClick={() => this.onClick(section._id)}
							>
								<div className={'dash-nav-section-icon'}>{<section.icon />}</div>
								<div className={'dash-nav-section-label'}>{section.name}</div>
							</div>
						))}
					</div>
					{user && isAdministrator(user.role) && (
						<React.Fragment>
							<div className='dash-nav-header'>Sections</div>
							<NavSections
								selected={id}
								sections={sections}
								onOrderSection={(oldIndex, newIndex) => this.props.onOrderSection(oldIndex, newIndex)}
								onClick={(id) => this.onClick(id)}
								onDeleteSection={(id) => this.props.onDeleteSection(id)}
								onAddSection={() => this.props.onAddSection()}
							/>
							<div
								key={'addnewsection'}
								className={'dash-nav-section-add'}
								onClick={() => this.onClick('addnewsection')}
							>
								<div className={'dash-nav-section-icon'}>
									<GoPlus />
								</div>
								<div className={'dash-nav-section-label'}>{'Add new...'}</div>
							</div>
							<div className='dash-nav-header'>Other</div>
							<div className='dash-nav-group'>
								{other.map((section, idx) => (
									<div
										key={idx}
										className={id === section._id ? 'dash-nav-section-selected' : 'dash-nav-section'}
										onClick={() => this.onClick(section._id)}
									>
										<div className={'dash-nav-section-icon'}>{<section.icon />}</div>
										<div className={'dash-nav-section-label'}>{section.name}</div>
									</div>
								))}
							</div>
						</React.Fragment>
					)}
					<div className='dash-nav-bottom'>
						<div className='dash-nav-link'>
							<a className='dash-nav-goto-site' href={'/'} target={'_blank'} rel='noopener noreferrer'>
								<div className={'dash-nav-section-icon'}>
									<FiGlobe />
								</div>
								Go to site
							</a>
						</div>
						<div className='dash-nav-link' onClick={this.props.onLogout}>
							<div className={'dash-nav-section-icon'}>
								<RiLogoutCircleRLine />
							</div>
							<div className={'dash-nav-section-label'}>Log out</div>
						</div>
					</div>
					<div id='dash-version'>{packageJson.version}</div>
				</div>
				<div id='dash-nav-border'></div>
			</div>
		);
	}
}

export default Nav;
