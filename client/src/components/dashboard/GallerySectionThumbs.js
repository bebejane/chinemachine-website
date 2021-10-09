import React, { Component } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
//import arrayMove from 'array-move';
import './GallerySectionThumbs.css';
import { AiOutlineMinusCircle, AiOutlinePlusCircle } from 'react-icons/ai';

const SortableItem = SortableElement(({ value, idx, current, onClick }) => {
	return (
		<div className={'dash-gallery-thumb-wrap'}>
			<img
				src={value}
				onClick={(e) => onClick(e, idx)}
				alt=''
				className={
					idx === current ? 'dash-gallery-thumb-active' : 'dash-gallery-thumb'
				}
			/>
			 
		</div>
	);
});
const SortableList = SortableContainer(
	({ items, current, onClick, onUpload, onDelete }) => {
		return (
			<div className={'dash-gallery-thumb-list-wrap'}>
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
				<div className={'dash-gallery-thumb-wrap'}>
					<div className={'dash-gallery-thumb-icon'}>
						<AiOutlinePlusCircle onClick={() => onUpload()} />
					</div>
					 
				</div>
				<div className={'dash-gallery-thumb-wrap'}>
					<div className={'dash-gallery-thumb-icon'}>
						<AiOutlineMinusCircle onClick={() => onDelete()} />
					</div>
					 
				</div>
			</div>
		);
	}
);

class GallerySectionThumbs extends Component {
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
	handleDelete(e, index) {
		console.log(index);
		this.props.onDelete(index);
	}
	render() {
		const { images, index } = this.state;

		return (
			<div id={'dash-gallery-thumb-container'}>
				<SortableList
					className={'dash-gallery-thumb-list'}
					helperClass={'dash-gallery-thumb-dragging'}
					items={images}
					axis={'xy'}
					distance={1}
					current={index}
					onSortEnd={(e) => this.handleSortEnd(e)}
					onClick={(e, idx) => this.handleClick(e, idx)}
					onUpload={() => this.handleUpload()}
					onDelete={(e, idx) => this.handleDelete(e, idx)}
				/>
			</div>
		);
	}
}

export default GallerySectionThumbs;
