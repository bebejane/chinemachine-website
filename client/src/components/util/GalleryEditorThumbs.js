import React, { Component } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import './GalleryEditorThumbs.css';
import { BsPlusCircle } from 'react-icons/bs';

const SortableItem = SortableElement(({ value, idx, current, onClick }) => {
	return (
		<div className={'gallery-editor-thumb-wrap'}>
			<img
				src={value}
				alt=''
				onClick={(e) => onClick(e, idx)}
				className={idx === current ? 'gallery-editor-thumb-active' : 'gallery-editor-thumb'}
			/>
		</div>
	);
});
const SortableList = SortableContainer(({ items, current, onClick, onUpload }) => {
	return (
		<div className={'gallery-editor-thumb-list-wrap'}>
			{items.map((value, index) => (
				<SortableItem
					key={`item-${value + index}`}
					index={index}
					idx={index}
					onClick={onClick}
					current={current}
					value={value}
				/>
			))}
			<div className={'gallery-editor-thumb-wrap'}>
				<div className={'gallery-editor-thumb-add'}>
					<BsPlusCircle onClick={() => onUpload()} />
				</div>
			</div>
		</div>
	);
});

class GalleryEditorThumbs extends Component {
	constructor(props) {
		super(props);
		this.state = {
			images: props.images || [],
		};
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		return nextProps;
	}

	handleSortEnd(e) {
		const { oldIndex, newIndex } = e;
		this.props.onSort(oldIndex, newIndex);
	}
	handleClick(e, idx) {
		this.props.onClick(e, idx);
	}
	handleUpload() {
		this.props.onUpload();
	}
	render() {
		const { images, index } = this.state;

		return (
			<div id={'gallery-editor-thumb-container'}>
				<SortableList
					className={'gallery-editor-thumb-list'}
					items={images.map((img) => img.src)}
					axis={'x'}
					distance={1}
					current={index}
					onSortEnd={(e) => this.handleSortEnd(e)}
					onClick={(e, idx) => this.handleClick(e, idx)}
					onUpload={() => this.handleUpload()}
				/>
			</div>
		);
	}
}

export default GalleryEditorThumbs;
