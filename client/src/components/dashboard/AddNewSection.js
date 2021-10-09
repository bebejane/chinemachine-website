import React, { Component } from 'react';
import './AddNewSection.css';
import Button from '../util/Button';
import Loader from '../util/Loader';
import { SECTION_TYPES } from '../../constants';
import sectionService from '../../services/sectionService';
import Select from 'react-select';

class AddNewSection extends Component {
	constructor(props) {
		super(props);
		this.state = {
			type: null,
			name: '',
			saving: false,
		};
		this.onFormChange = this.onFormChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	}
	onFormChange(id, value) {
		this.setState({
			[id]: value,
		});
	}
	async onSubmit(e) {
		e.preventDefault();
		this.setState({ saving: true }, async () => {
			const { type, name } = this.state;
			try {
				const section = await sectionService.add({ type, name });
				this.props.onAddedSection(section);
			} catch (err) {
				this.props.onError(err);
			}
			this.setState({ saving: false });
		});
	}
	render() {
		const { type } = this.props;
		const { saving } = this.state;
		const options = SECTION_TYPES.map((type) => {
			return { value: type, label: type };
		});

		return (
			<form onSubmit={this.onSubmit}>
				<div id='dash-add-section'>
					<div id='dash-add-section-wrap'>
						<Select
							placeholder='Select type...'
							value={type}
							id='type'
							options={options}
							onChange={(opt) => this.onFormChange('type', opt.value)}
						/>
						<input
							autoComplete='off'
							type='text'
							placeholder={'Title...'}
							id='name'
							onChange={(e) => this.onFormChange('name', e.target.value)}
						/>
						<div id='dash-add-section-wrap-add'>
							<Button type={'submit'} loading={saving}>
								ADD
							</Button>
						</div>
						{saving && <Loader message={'Saving section'} />}
					</div>
				</div>
			</form>
		);
	}
}
export default AddNewSection;
