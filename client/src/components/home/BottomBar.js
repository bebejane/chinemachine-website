import React, { Component } from 'react';
import './BottomBar.css';
import Footer from './Footer';
import LanguageSelector from './LanguageSelector';
import InfoBlock from './InfoBlock';
import InfoSection from './InfoSection';
import ShopSection from './ShopSection';
import GallerySection from './GallerySection';
import StoreInfo from './StoreInfo';
import MainImageGallery from './MainImageGallery';
import FindUs from './FindUs';

class BottomBar extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	componentDidMount() {
		this.props.history.listen((event) => {
			if (event.state) this.onBrowse(event.state.id);
		});
	}
	onBrowse(id) {
		this.props.onBrowse(id);
		setTimeout(() => this.scrollIntoView(id), 100);
	}
	scrollIntoView(id) {
		return;
		//const element = document.getElementById(id)
		//if(!element) return

		//setTimeout(()=>element.scrollIntoView({behavior:'smooth',block:'start'}), 400);
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}
	render() {
		const { dict, langCode, languages, sections } = this.props;

		return (
			<div id='bottom-bar'>
				<LanguageSelector
					onChangeLanguage={(langCode) => this.props.onChangeLanguage(langCode)}
					languages={languages}
					langCode={langCode}
					dict={dict}
				/>
				<MainImageGallery langCode={langCode} />
				<StoreInfo langCode={langCode} dict={dict} onBookAppointment={() => this.props.onBookAppointment(true)} />
				<div id='bottom-sections'>
					{sections.map((section, idx) => (
						<InfoBlock
							id={section._id}
							key={section._id}
							history={this.props.history}
							name={section.name}
							header={section.header || section.data.header}
							active={section.active || (section.data && section.data.active)}
							dict={dict}
							noBorder={sections.length === idx + 1}
						>
							{section.type === 'info' ? (
								<InfoSection
									key={section._id + section.type}
									content={section.data.content}
									langCode={langCode}
									dict={dict}
								/>
							) : section.type === 'gallery' ? (
								<GallerySection
									key={section._id + section.type}
									id={section._id}
									images={section.data.images}
									langCode={langCode}
									dict={dict}
								/>
							) : section.type === 'onlineshop' ? (
								<ShopSection
									key={section._id + section.type}
									id={section._id}
									langCode={langCode}
									dict={dict}
									onError={this.props.onError}
								/>
							) : section.type === 'findus' ? (
								<FindUs
									key={section._id + section.type}
									id={section._id}
									langCode={langCode}
									dict={dict}
									onError={this.props.onError}
								/>
							) : null}
						</InfoBlock>
					))}
				</div>
				<Footer />
			</div>
		);
	}
}
export default BottomBar;
