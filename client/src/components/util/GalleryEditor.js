import React, { Component } from 'react';
import './GalleryEditor.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

import Button from '../util/Button';
import Loader from '../util/Loader';
import Modal from '../dashboard/Modal';

import FileUploader from './FileUploader';
import LanguageSelector from '../dashboard/LanguageSelector';
import GalleryEditorThumbs from './GalleryEditorThumbs';
import { BsPlusCircle, BsTrash } from 'react-icons/bs';
import { Carousel } from 'react-responsive-carousel';

import sectionService from '../../services/sectionService';
import galleryService from '../../services/galleryService';
import galleryImageService from '../../services/galleryImageService';
import arrayMove from 'array-move';
import Pica from 'pica';

class GalleryEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {
			gallery: {},
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
	}
	componentDidMount() {
		this.loadGallery();
	}
	async loadGallery() {
		try {
			const { id, langCode } = this.props;
			const gallery = (await sectionService.getSectionData(id, langCode)) || {};
			const images = !gallery._id ? [] : await galleryImageService.getImages(gallery._id);

			this.setState({
				gallery: {
					...gallery,
					sectionId: this.props.id,
					langCode: this.props.langCode,
				},
				images,
				loading: false,
			});
			console.log('loaded', gallery, images);
		} catch (err) {
			this.handleError(err);
		}
	}
	async handleSaveGallery(e) {
		if (e) e.preventDefault();
		this.setState({ saving: true });
		const { gallery } = this.state;
		try {
			const newGallery = !gallery._id
				? await galleryService.add(gallery)
				: await galleryService.update(gallery._id, gallery);
			const newImages = await this.handleSaveGalleryImages(newGallery._id);
			this.setState({ gallery: newGallery, image: newImages });
		} catch (err) {
			this.handleError(err);
		}
		this.handleEndSaveGallery();
	}
	async handleSaveGalleryImages(galleryId) {
		const { images } = this.state;
		if (images.length === 0) return images;

		const newImages = [];
		this.setState({
			uploading: true,
			uploadError: null,
			uploadProgress: {
				uploaded: 0,
				total: images.length,
			},
		});
		console.log(images);
		try {
			for (var i = 0; i < images.length; i++) {
				const image = {
					sectionId: images[i].sectionId,
					galleryId,
					image: images[i].image,
					mimeType: images[i].mimeType,
					order: i + 1,
				};
				if (images[i]._id) image._id = images[i]._id;
				console.log(image);
				newImages.push(image._id ? await galleryImageService.update(image) : await galleryImageService.add(image));
				this.setState({
					uploadProgress: { uploaded: i + 1, total: images.length },
				});
			}
		} catch (err) {
			this.setState({ uploadError: err });
			this.handleError(err);
		}
		this.setState({ uploading: false, uploadProgress: null });

		return newImages;
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
	handleHeaderChange(header) {
		const gallery = { ...this.state.gallery, header };
		this.setState({ gallery, changed: true });
	}
	handleChangeLanguage(langCode) {
		const { changed } = this.state;
		if (changed) return this.setState({ showSaveModal: true, changeLangCode: langCode });

		this.props.onChangeLanguage(langCode);
	}
	handleImageSort(oldIndex, newIndex) {
		const images = arrayMove(this.state.images, oldIndex, newIndex);
		this.setState({ images, index: newIndex, changed: true });
	}
	handleImageChange(index, item) {
		this.setState({ index });
	}
	handleImageClick(e, index) {
		this.setState({ index: index });
	}
	async handleImageDelete(e, index) {
		try {
			const { images } = this.state;
			const image = images[index];
			if (image._id) {
				this.setState({ saving: true });
				await galleryImageService.delete(image._id);
			}

			images.splice(index, 1);
			this.setState({ images, index: index - 1 < 0 ? 0 : --index });
		} catch (err) {
			this.handleError(err);
		}
		this.setState({ saving: false });
	}
	handleMultiUpload(uploads) {
		this.setState({ processing: true, processingError: null });
		uploads.forEach(({ contents, filename }) => {
			this.handleAddUpload(contents, filename);
		});
		this.setState({ processing: false });
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
		this.setState({ processing: true });
		for (var i = 0; i < files.length; i++) {
			try {
				const upload = await this.handleImageUploadFile(files[i]);
				this.handleAddUpload(upload.content, upload.filename);
			} catch (processingError) {
				this.setState({ processingError });
				this.handleError(processingError);
				break;
			}
		}
		this.setState({ processing: false, processingError: null });
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
	async handleAddUpload(content, filename) {
		try {
			const { images } = this.state;
			const { id } = this.props;
			const mimeType = filenameToMimeType(filename);
			if (!mimeType) throw new Error('Unknown image format');
			console.log('mime', mimeType);
			const image = new Blob([content], { type: mimeType });
			const originalSrc = URL.createObjectURL(image);
			const resizedBlob = await resizeImage(originalSrc, mimeType, {
				height: 400,
				outputFormat: 'png',
			});
			const src = URL.createObjectURL(resizedBlob);
			images.push({ sectionId: id, src, image, mimeType, upload: true });
			this.setState({ images, index: images.length - 1, changed: true });
		} catch (err) {
			this.handleError(err);
		}
	}
	handleError(err) {
		this.props.onError(err);
	}
	render() {
		const { languages, langCode } = this.props;
		const {
			images,
			changed,
			saving,
			index,
			processing,
			//processingError,
			//processingProgress,
			//uploading,
			uploadProgress,
			deleting,
			showSaveModal,
		} = this.state;
		//console.log(processingProgress)

		return (
			<div id='gallery-editor'>
				<form id='gallery-editor-form' onSubmit={(e) => this.handleSaveGallery(e)}>
					<div id='gallery-editor-top'>
						<div id='gallery-editor-wrap'>
							{images.length ? (
								<Carousel
									className='carousel-wrapper'
									showStatus={false}
									showArrows={false}
									showThumbs={false}
									infiniteLoop={false}
									useKeyboardArrows={true}
									autoPlay={false}
									emulateTouch={true}
									selectedItem={index}
									dynamicHeight={true}
									onChange={(index, item) => this.handleImageChange(index, item)}
								>
									{images.map((image, idx) => (
										<div key={idx}>
											<img src={image.src} alt='' />
										</div>
									))}
								</Carousel>
							) : (
								<div id='gallery-editor-empty'>
									<FileUploader
										label={'drop image'}
										multi={true}
										backgroundColor={'#fff'}
										color={'#000'}
										onMultiUpload={(uploads) => this.handleMultiUpload(uploads)}
										onUpload={(content, filename) => this.handleUpload(content, filename)}
										onUploadProgress={(prog) => this.handleUploadProgress(prog)}
									/>
									<div id='gallery-editor-empty-upload'>
										<div>
											<BsPlusCircle
												className='gallery-editor-empty-upload-button'
												onClick={(e) => this.handleImageUpload(e)}
											/>
										</div>
										<div>Drop files here</div>
									</div>
								</div>
							)}
							{images.length > 0 && (
								<div id='gallery-editor-image-delete' onClick={(e) => this.handleImageDelete(e, index)}>
									<BsTrash />
								</div>
							)}
						</div>
						<GalleryEditorThumbs
							index={index}
							images={images}
							onSort={(oldIndex, newIndex) => this.handleImageSort(oldIndex, newIndex)}
							onClick={(e, idx) => this.handleImageClick(e, idx)}
							onUpload={() => this.handleImageUpload()}
						/>
						{saving && (
							<Loader
								message={
									'Saving gallery ' + (uploadProgress ? uploadProgress.uploaded + ' / ' + uploadProgress.total : '')
								}
							/>
						)}
						{processing && <Loader message={'Adding images'} />}
						{deleting && <Loader message={'Deleting image'} />}
					</div>
					<div id='gallery-editor-bottom'>
						<div id='gallery-editor-buttons'>
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
				</form>
				<form id='gallery-editor-image-upload-form'>
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

const resizeImage = (src, mimeType, opt) => {
	return new Promise((resolve, reject) => {
		const resizeCanvas = document.createElement('canvas');
		const image = document.createElement('img');
		image.src = src;
		image.addEventListener('load', () => {
			let height = image.height;
			let width = image.width;

			if (opt.height && !opt.width) {
				width = (opt.height / height) * width;
				height = opt.height;
			} else if (!opt.height && opt.width) {
				height = (opt.width / width) * height;
				width = opt.width;
			} else if (opt.height && opt.width) {
				height = opt.height;
				width = opt.width;
			}

			resizeCanvas.height = height;
			resizeCanvas.width = width;

			const pica = new Pica();
			pica
				.resize(image, resizeCanvas)
				.then((result) => pica.toBlob(result, mimeType, 0.9))
				.then(resolve)
				.then(() => {
					if (image.remove) {
						image.remove();
						resizeCanvas.remove();
					}
					image = null;
					resizeCanvas = null;
				})
				.catch(reject);
		});
		image.addEventListener('error', reject);
	});
};

export default GalleryEditor;
