import React, { Component } from 'react';
import { BiMinus } from 'react-icons/bi';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import './Nav.css';

const SortableItem = SortableElement(
	({
		section,
		index,
		selected,
		sectionMenu,
		onSectionHover,
		onSectionMenu,
		onDeleteSection,
		hoverSection,
		onClick,
	}) => {
		return (
			<div
				key={index}
				onMouseEnter={() => onSectionHover(section._id, true)}
				onMouseLeave={() => onSectionHover(section._id, false)}
				className={selected === section._id ? 'dash-nav-section-selected' : 'dash-nav-section'}
				onClick={() => onClick(section._id)}
			>
				<div className={'dash-nav-section-icon'}>{<section.icon />}</div>
				<div className={'dash-nav-section-label'}>
					{section.name}
					{/*
                    <input 
                        className='dash-nav-seaction-name' 
                        type='text' 
                        value={section.name} 
                        readonly={true}
                    />
                */}
				</div>
				{selected === section._id && !section.noDelete && (
					<div className={'dash-nav-section-delete'}>
						<BiMinus onClick={(e) => onDeleteSection(e, section._id)} />
					</div>
				)}
			</div>
		);
	}
);
const SortableList = SortableContainer(
	({
		items,
		index,
		selected,
		sectionMenu,
		onSectionHover,
		onSectionMenu,
		hoverSection,
		onClick,
		onDeleteSection,
		onAddSection,
	}) => {
		return (
			<div className={'dash-nav-section-group'}>
				{items.map((section, index) => (
					<SortableItem
						key={`item-${index}`}
						section={section}
						index={index}
						selected={selected}
						sectionMenu={sectionMenu}
						onClick={onClick}
						onDeleteSection={onDeleteSection}
						onSectionHover={onSectionHover}
						onSectionMenu={onSectionMenu}
						hoverSection={hoverSection}
					/>
				))}
			</div>
		);
	}
);

class NavSections extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sections: props.sections,
			selected: props.selected,
			sectionMenu: null,
			hoverSection: null,
		};
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}

	handleSortSection(e) {
		const { oldIndex, newIndex } = e;
		this.props.onOrderSection(oldIndex, newIndex);
	}
	handleClick(id) {
		this.props.onClick(id);
	}
	handleDeleteSection(e, id) {
		e.stopPropagation();
		this.props.onDeleteSection(id);
	}
	handleAddSection(e) {
		this.props.onAddSection(e);
	}
	handleHoverSection(id) {
		this.setState({ hoverSection: id });
	}
	handleSectionMenu(e, id) {
		e.stopPropagation();
		this.setState({ sectionMenu: id });
	}
	render() {
		const { sections, hoverSection, selected, sectionMenu } = this.state;
		return (
			<SortableList
				helperClass={'dash-nav-sort'}
				hideSortableGhost={true}
				items={sections}
				axis={'y'}
				hoverSection={hoverSection}
				sectionMenu={sectionMenu}
				pressDelay={500}
				selected={selected}
				onSortEnd={(e) => this.handleSortSection(e)}
				onClick={(id) => this.handleClick(id)}
				onSectionHover={(id) => this.handleHoverSection(id)}
				onDeleteSection={(e, id) => this.handleDeleteSection(e, id)}
				onSectionMenu={(e, id) => this.handleSectionMenu(e, id)}
				onAddSection={(e) => this.handleAddSection(e)}
			/>
		);
	}
}
export default NavSections;
