import React, { Component } from 'react';
import './GallerySection.css';

import Checkbox from '../util/Checkbox';
import Button from '../util/Button';
import Loader from '../util/Loader';
import Modal from './Modal';
import ImageCarousel from '../util/ImageCarousel';

import FileUploader from '../util/FileUploader';
import LanguageSelector from './LanguageSelector';
import GallerySectionThumbs from './GallerySectionThumbs';
import { BsPlusCircle, BsTrash } from 'react-icons/bs';
import sectionService from '../../services/sectionService';
import galleryService from '../../services/galleryService';
import galleryImageService from '../../services/galleryImageService';
import imageService from '../../services/imageService';
import arrayMove from 'array-move';

class GallerySection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			gallery: { images: [] },
			image: undefined,
			images: [],
			index: 0,
			saving: false,
			changed: false,
			processing: false,
			processingError: null,
			processingProgress: null,
			uploading: false,
			uploadError: null,
			uploadProgress: null,
			deleting: false,
			showSaveModal: false,
		};
		this.fileUploaderRef = React.createRef();
		this.handleImageUploadFileChange = this.handleImageUploadFileChange.bind(this);
		this.handleMainGallery = this.handleMainGallery.bind(this);
		this.handleLabelChange = this.handleLabelChange.bind(this);
	}
	componentDidMount() {
		this.loadGallery();
	}
	async loadGallery() {
		try {
			const { id, langCode } = this.props;
			const gallery = (await sectionService.getSectionData(id, langCode)) || this.state.gallery;
			this.setState({
				gallery: {
					...gallery,
					sectionId: this.props.id,
					langCode: this.props.langCode,
				},
				image: gallery.images ? gallery.images[0] : undefined,
				loading: false,
			});
		} catch (err) {
			this.handleError(err);
		}
	}
	async handleSaveGallery(e) {
		if (e) e.preventDefault();

		let { gallery } = this.state;
		this.setState({ saving: true });

		try {
			gallery = !gallery._id ? await galleryService.add(gallery) : await galleryService.update(gallery._id, gallery);
			gallery.images = await this.handleSaveGalleryImages(gallery._id);
			this.setState({ gallery });
		} catch (err) {
			this.handleError(err);
		}

		this.handleEndSaveGallery();
		return Promise.resolve(gallery);
	}
	async handleSaveGalleryImages(galleryId) {
		const { gallery } = this.state;

		if (gallery.images.length === 0) return Promise.resolve(gallery.images);

		const newImages = [];
		this.setState({
			uploading: true,
			saving: true,
			uploadError: null,
			uploadProgress: {
				uploaded: 0,
				total: gallery.images.length,
			},
		});
		try {
			for (var i = 0; i < gallery.images.length; i++) {
				const image = {
					...gallery.images[i],
					imageId: gallery.images[i].imageId || gallery.images[i]._id,
					order: i + 1,
				};
				newImages.push(
					image._id ? await galleryImageService.update(image._id, image) : await galleryImageService.add(image)
				);
				this.setState({
					uploadProgress: { uploaded: i + 1, total: gallery.images.length },
				});
			}
		} catch (err) {
			this.setState({ uploadError: err });
			this.handleError(err);
		}
		this.setState({ saving: false, uploading: false, uploadProgress: null });

		return Promise.resolve(newImages || []);
	}
	handleEndSaveGallery() {
		const { changeLangCode } = this.state;
		this.setState({
			showSaveModal: false,
			changed: false,
			changeLangCode: null,
			saving: false,
		});
		if (changeLangCode) this.props.onChangeLanguage(changeLangCode);
	}
	async handleAddImages(uploads) {
		try {
			let { gallery } = this.state;

			if (!gallery || !gallery._id) return this.handleError(new Error('Header required first'));

			uploads = !Array.isArray(uploads) ? [uploads] : uploads;
			this.setState({
				uploadProgress: {
					total: uploads.length,
					uploaded: 0,
				},
				uploading: true,
			});

			for (var i = 0; i < uploads.length; i++) {
				const mimeType = filenameToMimeType(uploads[i].filename);
				if (!mimeType) throw new Error('Unknown image format');

				const blob = new Blob([uploads[i].content], { type: mimeType });
				const image = await imageService.add({ image: blob, mimeType });

				const galleryImage = await galleryImageService.add({
					imageId: image._id,
					sectionId: this.props.id,
					galleryId: gallery._id,
					order: gallery.images.length + 1,
				});
				gallery.images.push({ ...galleryImage, labels: {} });

				this.setState({
					uploadProgress: {
						total: uploads.length,
						uploaded: i + 1,
					},
				});
			}

			gallery = await this.handleSaveGallery();
			const index = gallery.images.length - 1;
			this.setState({ gallery, changed: true, uploading: false }, async () => {
				this.handleImageChange(index);
			});
		} catch (err) {
			console.log('error adding');
			this.handleError(err);
		}
	}
	handleHeaderChange(header) {
		const gallery = { ...this.state.gallery, header };
		this.setState({ gallery, changed: true });
	}
	handleChangeLanguage(langCode) {
		const { changed } = this.state;
		if (changed) return this.setState({ showSaveModal: true, changeLangCode: langCode });

		this.props.onChangeLanguage(langCode);
	}
	handleMainGallery(checked) {
		const gallery = { ...this.state.gallery, mainGallery: checked };
		this.setState({ gallery, changed: true });
	}
	handleActiveGallery(active) {
		const gallery = { ...this.state.gallery, active };
		this.setState({ gallery, changed: true });
	}
	handleLabelChange(e) {
		let { image, images, gallery } = this.state;
		const { langCode } = this.props;
		const label = e.target.value;
		if (image) {
			if (!images.label) images.label = {};

			image.labels[langCode] = label;
			gallery.images = gallery.images.map((i, idx) => (i._id === image._id ? image : i));
		}
		this.setState({ gallery, image, changed: true });
	}
	handleImageSort(oldIndex, newIndex) {
		let { gallery } = this.state;
		gallery.images = arrayMove(gallery.images, oldIndex, newIndex).map((i, order) => {
			return { ...i, order: order + 1 };
		});
		this.setState({ gallery }, () => this.handleImageChange(newIndex));
	}
	handleImageChange(index) {
		const image = this.state.gallery.images[index];
		this.setState({ index, image, changed: true });
		if (this.slider) this.slider.slickGoTo(index);
	}
	handleImageClick(e, index) {
		this.handleImageChange(index);
	}
	async handleImageDelete(e, index) {
		try {
			const { gallery } = this.state;
			if (gallery.images[index]._id) {
				this.setState({ saving: true });
				await galleryImageService.delete(gallery.images[index]._id);
			}
			gallery.images.splice(index, 1);
			index = index - 1 < 0 ? 0 : --index;
			this.setState({ gallery }, () => {
				this.handleImageChange(index);
			});
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	handleMultiUpload(uploads) {
		this.handleAddImages(uploads);
	}
	handleUploadProgress(processingProgress) {
		this.setState({ processingProgress });
	}
	handleImageUpload(e) {
		if (e) e.stopPropagation();
		this.fileUploaderRef.current.removeEventListener('change', this.handleImageUploadFileChange);
		this.fileUploaderRef.current.addEventListener('change', this.handleImageUploadFileChange);
		this.fileUploaderRef.current.click();
	}
	async handleImageUploadFileChange(event) {
		const { files } = event.target;
		if (!files.length) return;
		const uploads = [];

		this.setState({
			uploading: true,
			uploadError: null,
			uploadProgress: {
				uploaded: 0,
				total: files.length,
			},
		});
		try {
			for (var i = 0; i < files.length; i++) {
				uploads.push(await this.handleImageUploadFile(files[i]));
				this.setState({
					uploading: true,
					uploadError: null,
					uploadProgress: {
						uploaded: uploads.length,
						total: files.length,
					},
				});
			}
			await this.handleAddImages(uploads);
		} catch (err) {
			this.handleError(err);
		}
		this.setState({
			uploading: false,
			uploadProgress: {
				uploaded: uploads.length,
				total: files.length,
			},
		});
	}
	handleImageUploadFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('load', (e) => {
				resolve({ content: e.srcElement.result, filename: file.name });
			});
			reader.addEventListener('progress', (e) => {
				this.handleUploadProgress({
					loaded: e.loaded,
					total: e.total,
					progress: parseInt((e.loaded / e.total) * 100),
				});
			});
			reader.addEventListener('error', (err) => {
				reject(err);
			});
			reader.addEventListener('abort', () => {
				reject('ABORTED');
			});
			reader.readAsArrayBuffer(file);
		});
	}

	handleError(err) {
		this.props.onError(err);
	}
	render() {
		const { languages, langCode } = this.props;
		const { gallery, image, changed, saving, index, uploading, uploadProgress, deleting, showSaveModal } = this.state;

		return (
			<div id='dash-gallery'>
				<form id='dash-gallery-form' onSubmit={(e) => this.handleSaveGallery(e)}>
					<div id='dash-gallery-top'>
						<input
							id={'header'}
							className={'dash-gallery-header-input'}
							type='text'
							placeholder={'Header...'}
							value={gallery.header || ''}
							onChange={(e) => this.handleHeaderChange(e.target.value)}
						/>
						<div id='dash-gallery-wrap'>
							{gallery.images.length ? (
								<ImageCarousel
									langCode={langCode}
									images={gallery.images}
									onRef={(slider) => (this.slider = slider)}
									onAfterChange={(index, item) => this.handleImageChange(index, item)}
								/>
							) : (
								<div id='dash-gallery-empty'>
									<FileUploader
										label={'drop image'}
										multi={true}
										backgroundColor={'#fff'}
										color={'#000'}
										onMultiUpload={(uploads) => this.handleMultiUpload(uploads)}
										onUpload={(content, filename) => this.handleUpload(content, filename)}
										onUploadProgress={(prog) => this.handleUploadProgress(prog)}
									/>
									<div id='dash-gallery-empty-upload'>
										<div>
											<BsPlusCircle
												className='dash-gallery-empty-upload-button'
												onClick={(e) => this.handleImageUpload(e)}
											/>
										</div>
										<div>Drop files here</div>
									</div>
								</div>
							)}
							{gallery.images.length > 0 && (
								<div id='dash-gallery-image-delete' onClick={(e) => this.handleImageDelete(e, index)}>
									<BsTrash />
								</div>
							)}
						</div>
						<GallerySectionThumbs
							index={index}
							images={gallery.images.map((image) => '/api/image/' + image.imageId + '/image/thumb')}
							onSort={(oldIndex, newIndex) => this.handleImageSort(oldIndex, newIndex)}
							onClick={(e, idx) => this.handleImageClick(e, idx)}
							onDelete={(e, idx) => this.handleImageDelete(e, index)}
							onUpload={() => this.handleImageUpload()}
						/>
						{saving && (
							<Loader
								message={
									'Saving gallery ' + (uploadProgress ? uploadProgress.uploaded + ' / ' + uploadProgress.total : '')
								}
							/>
						)}
						{uploading && !saving && (
							<Loader
								message={'Uploading ' + (uploadProgress ? uploadProgress.uploaded + ' / ' + uploadProgress.total : '')}
							/>
						)}
						{deleting && <Loader message={'Deleting image'} />}
					</div>
					<div id={'dash-gallery-label'}>
						<input
							type='text'
							value={image && image.labels && image.labels[langCode] ? image.labels[langCode] : ''}
							placeholder='Label...'
							onChange={this.handleLabelChange}
						/>
					</div>
					<div id='dash-gallery-bottom'>
						<div id='dash-gallery-buttons'>
							<Button type={'submit'} loading={saving} disabled={!changed}>
								SAVE
							</Button>
						</div>
						<LanguageSelector
							langCode={langCode}
							languages={languages}
							onChangeLanguage={(langCode) => this.handleChangeLanguage(langCode)}
						/>
					</div>
					<div id='dash-gallery-options'>
						<Checkbox
							id='mainGallery'
							checked={gallery.mainGallery || false}
							onChange={(checked) => this.handleMainGallery(checked)}
							label={'Main gallery'}
						/>
						<Checkbox
							id='active'
							checked={gallery.active || false}
							onChange={(checked) => this.handleActiveGallery(checked)}
							label={'Expanded'}
						/>
					</div>
				</form>
				<form id='gallery-image-upload-form'>
					<input
						id='gallery-image-upload-form-file'
						ref={this.fileUploaderRef}
						multiple='multiple'
						accept='image/*'
						type='file'
					/>
				</form>
				{showSaveModal && (
					<Modal
						onConfirm={(e) => this.handleSaveGallery(e)}
						onCancel={(e) => this.handleEndSaveGallery(e)}
						message='Save changes?'
						header='Save'
						confirm='Save'
						cancel='Cancel'
					/>
				)}
			</div>
		);
	}
}

const filenameToMimeType = (filename) => {
	const file = filename.toLowerCase();
	if (file.endsWith('.png')) return 'image/png';
	else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
	else return null;
};
export default GallerySection;
