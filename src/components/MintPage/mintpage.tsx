
import React from 'react';
import Tippy from '@tippyjs/react';
import Dropzone from 'react-dropzone';
import {
	withRouter,
} from 'react-router-dom';
import { withTranslation, } from "react-i18next";
import {
	History,
	Location
} from 'history';
import {
	MetamaskAdapter,
	_AssetType
} from '../../models/BlockchainAdapter';

import {
	NftMinterContract
} from '../../models/BlockchainAdapter';

import {
	fetchSwarmStamp,
	getOracleNftMinterSign
} from '../../models/APIService/apiservice';
import {
	clearError,
	clearInfo,
	setError,
	setInfo
} from '../../reducers';

import icon_i_del            from '../../static/pics/i-del.svg';
import icon_loader           from '../../static/pics/loader-orange.svg';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type MintPageProps = {
	store                  : any,
	metamaskAdapter        : MetamaskAdapter,
	showAuthMethodSelector?: Function;
	t                      : any,
	match                  : any;
	location               : Location,
	history                : History,
	closePageFunction?     : (address?: string) => void;
}
type MintPageState = {

	chainId       : number,
	userAddress   : string,

	balanceNative : BigNumber,
	decimalsNative: number,
	symbolNative  : string,
	iconNative    : string,
	EIPPrefix     : string,
	explorerBaseUrl: string,
	explorerName   : string,

	fileReader: FileReader,
	nftImagePreview: string | ArrayBuffer,
	nftImageMimeType: string,
	inputNftImageUrl: string,
	inputNftInfoName: string,
	inputNftInfoDesc: string,
	descriptionRows: number,
	nftPropertiesData  : Array<{
		type: string,
		name: string
	}>,
	nftPropertiesDataTmp  : Array<{
		type: string,
		name: string
	}>,
	swarmNftImageUrl: string,
	swarmNftJsonUrl: string,
	mintedNftTxId: string,
	mintedNftContract: string | undefined,
	nftPropertiesOpened: boolean,
	advancedOptionsOpened: boolean,
	savingMetadataOpened: boolean,
	inputStandart: _AssetType,
	inputBatch  : string,
	inputCopies  : string,

	showErrors: Array<string>,
}

class MintPage extends React.Component<MintPageProps, MintPageState> {

	store                  : any;
	metamaskAdapter        : MetamaskAdapter;
	showAuthMethodSelector?: Function;
	unsubscribe!           : Function;
	t                      : any;
	focusable              : any;
	scrollable             : any;
	closePageFunction?     : (address?: string) => void;
	nftMinterContract      : NftMinterContract | undefined;

	constructor(props: MintPageProps) {
		super(props);

		this.store                  = props.store;
		this.metamaskAdapter        = props.metamaskAdapter;
		this.t                      = props.t;
		this.showAuthMethodSelector = props.showAuthMethodSelector;
		this.closePageFunction      = props.closePageFunction;
		this.focusable              = {};
		this.scrollable             = {};

		this.nftMinterContract = this.metamaskAdapter.getNftMinterContract();

		if (
			!this.store.getState()._error &&
			this.metamaskAdapter &&
			this.metamaskAdapter.chainConfig &&
			!this.metamaskAdapter.chainConfig.nftMinterContract721
		) {
			this.store.dispatch(setError({
				text: `Mint in this network is not supported yet`,
				buttons: [{
					text: this.t('Ok'),
					clickFunc: () => {
						this.props.history.push(`/mint`);
						setTimeout(() => { this.store.dispatch(clearError()); }, 10)
					}
				}],
				links: undefined
			}));
		}

		this.state = {
			chainId       : this.store.getState().metamaskAdapter.chainId,
			userAddress   : this.store.getState().account.address || '',

			balanceNative : this.store.getState().account.balanceNative,
			decimalsNative: this.store.getState().metamaskAdapter.networkTokenDecimals,
			symbolNative  : this.store.getState().metamaskAdapter.networkTokenTicket,
			iconNative    : this.store.getState().metamaskAdapter.networkTokenIcon,
			EIPPrefix     : this.store.getState().metamaskAdapter.EIPPrefix,
			explorerBaseUrl: this.store.getState().metamaskAdapter.explorerBaseUrl,
			explorerName  : this.store.getState().metamaskAdapter.explorerName,

			fileReader: new FileReader(),
			nftImagePreview: '',
			nftImageMimeType: '',
			inputNftImageUrl: '',
			inputNftInfoName: '',
			inputNftInfoDesc: '',
			descriptionRows: 5,
			nftPropertiesData: [],
			nftPropertiesDataTmp: [],
			swarmNftImageUrl: '',
			swarmNftJsonUrl: '',
			mintedNftTxId: '',
			mintedNftContract: '',
			nftPropertiesOpened: false,
			advancedOptionsOpened: false,
			savingMetadataOpened: false,
			inputStandart: _AssetType.ERC721,
			inputBatch   : '1',
			inputCopies  : '1',

			showErrors: [],
		};

	}

	componentDidMount() {
		this.unsubscribe = this.store.subscribe(() => {
			if ( !this.nftMinterContract ) { this.nftMinterContract = this.metamaskAdapter.getNftMinterContract(); }

			this.setState({
				chainId          : this.store.getState().metamaskAdapter.chainId,
				userAddress      : this.store.getState().account.address || '',
				balanceNative    : this.store.getState().account.balanceNative,
				decimalsNative   : this.store.getState().metamaskAdapter.networkTokenDecimals,
				symbolNative     : this.store.getState().metamaskAdapter.networkTokenTicket,
				iconNative       : this.store.getState().metamaskAdapter.networkTokenIcon,
				EIPPrefix        : this.store.getState().metamaskAdapter.EIPPrefix,
				explorerBaseUrl  : this.store.getState().metamaskAdapter.explorerBaseUrl,
				explorerName     : this.store.getState().metamaskAdapter.explorerName,
			});

		});
 	}
	componentWillUnmount() {
		this.unsubscribe();
	}

	getGeneralInfoBlock() {
		const showError = this.state.showErrors.find((item) => { return item === 'nftimg' });
		return (
			<div
				className="c-wrap"
				ref={ (e) => { this.scrollable.generalInfo = e } }
			>
				<div className="row">
					<div className="col-md-5 mb-5 mb-md-0">
						{ this.getNftImgPreview() }
						<div className="input-group">
							<label className="input-label">
								or enter an external URL
								<Tippy
									content={ this.t('Paste full URL to the file from external source') }
									appendTo={ document.getElementsByClassName("wrapper")[0] }
									trigger='mouseenter'
									interactive={ false }
									arrow={ false }
									maxWidth={ 512 }
								>
									<span className="i-tip ml-1"></span>
								</Tippy>
							</label>
							<input
								className={`input-control ${ showError ? 'has-error' : '' }`}
								type="text"
								value={ this.state.inputNftImageUrl }
								onChange={(e) => {
									this.getNftImageUrl(e.target.value)
									this.setState({
										inputNftImageUrl: e.target.value,
										showErrors: this.state.showErrors.filter((item) => { return item !== 'emptyInfoUrl' })
									})
								}}
								onKeyPress={(e) => {
									if ( e.defaultPrevented) { return; }
								}}
								disabled={ ((this.state.nftImagePreview && !this.state.inputNftImageUrl) ? true : false) }
							/>
						</div>
						<div>
							<div className="mb-2"> <small className="text-muted">File types supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF. </small></div>
							<div> <small className="text-muted">Max size: 100 MB</small></div>
						</div>
					</div>
					<div className="col-md-7 pl-md-6">
						<div className="input-group">
							<label className="input-label">Name<sup className="text-red">*</sup></label>
							<input
								className={`input-control ${ showError ? 'has-error' : '' }`}
								type="text"
								value={ this.state.inputNftInfoName }
								onChange={(e) => {
									this.setState({
										inputNftInfoName: e.target.value,
										showErrors: this.state.showErrors.filter((item) => { return item !== 'emptyInfoName' })
									})
								}}
								onKeyPress={(e) => {
									if ( e.defaultPrevented) { return; }
								}}
							/>
						</div>
						<div className="input-group mb-0">
							<label className="input-label">Description<sup className="text-red">*</sup></label>
							<textarea
								className="input-control"
								rows={ this.state.descriptionRows }
								value={ this.state.inputNftInfoDesc }
								onChange={(e) => {
									this.setState({
										inputNftInfoDesc: e.target.value,
										showErrors: this.state.showErrors.filter((item) => { return item !== 'emptyInfoDesc' })
									})
								}}
								onKeyPress={(e) => {
									if ( e.defaultPrevented) { return; }
								}}
							></textarea>
						</div>
					</div>
				</div>
			</div>
		)
	}
	async getNftImageUrl(url: string) {
		if(!url.toString().match(/http/i) || !url) {
			this.setState({ nftImagePreview: '' })
		}
		else {
			const processResponse = (res:any) => {
				const statusCode = res.status
				const contentType = res.headers.get("Content-Type")
				const data = res.arrayBuffer()
				return Promise.all([statusCode, contentType, data]).then(res => ({
					statusCode: res[0],
					contentType: res[1],
					data: res[2]
				}))
			}
			await fetch( url )
				.then(processResponse)
				.then( res => {
					const { statusCode, contentType, data } = res
					if(statusCode === 200) {
						const blob = new Blob( [data] )
						const file = this.state.fileReader
						file.addEventListener('loadend', async (e) => {
							const result = e.target?.result
							if (result) {
								this.setState({ nftImagePreview: result })
								this.setState({ nftImageMimeType: contentType })
								this.setState({ inputNftImageUrl: url })
							}
						})
						file.readAsDataURL(blob)
					}
					else {
						this.setState({ nftImagePreview: '' })
					}
				})
				.catch( error => {
					console.error(error)
				})
		}
	}
	getNftImgPreview() {

		if ( !this.state.nftImagePreview ) {
			return (
				<Dropzone
					onDrop={(files) => { this.previewOnDrop(files) }}
					accept={ "image/*,audio/mpeg,audio/ogg,audio/wav,audio/webm,video/webm,video/mp4,video/ogg,model/gltf-binary,model/gltf+json" }
					noKeyboard={ true }
				>
					{
						({ getRootProps, getInputProps, isDragActive, open }) => (
							<div {...getRootProps({ className: `upload-container nft-upload mb-4 dropzone ${isDragActive ? 'file-dragged' : ''}` })}>
								<div className="upload-poopover">
									<div className="inner">
										<div className="h5 mb-0">
											<input {...getInputProps()} />
											<p>{ this.t('Drop your file here') } <br />{ this.t('or click to browse.') }</p>
										</div>
									</div>
								</div>
							</div>
						)
					}
				</Dropzone>
			)
		}

		return  (
			<div className="nft-upload-img">
				{ this.showNftImgPreview() }
				<button
					className="btn-del"
					onClick={() => {
						this.setState({ nftImagePreview: '' })
						this.setState({ inputNftImageUrl: '' })
					}}
				><img src={ icon_i_del} alt="" /></button>
			</div>
		)
	}
	showNftImgPreview() {
		const nftImage = this.state.nftImagePreview ? this.state.nftImagePreview.toString() : ''
		if ( this.state.nftImageMimeType.includes("video/") ) {
			return (
				<video className="img" style={{ width: "100%", height: "100%" }} loop={ true } autoPlay={ true } muted={ true }>
					<source src={ nftImage } type={ this.state.nftImageMimeType } />
				</video>
			)
		}
		else if ( this.state.nftImageMimeType.includes("audio/") ) {
			return (
				<audio controls={ true } preload="none">
				    <source src={ nftImage } type={ this.state.nftImageMimeType } />
				</audio>
			)
		}
		else {
			return (
				<img
					src={ nftImage }
					className="img"
					alt=""
				/>
			)
		}
	}
	previewOnDrop(files: Array<File>) {
		if(files[0]) {
			const imageMimeType = /(image|audio|video)\/(png|jpg|jpeg|svg|gif|webp|webm|mpeg|mp3|mp4|wav|ogg|glb|gltf)/i
			const contentType = files[0].type
			if (!contentType.match(imageMimeType)) {
				console.log("Unsupported MimeType file - " + contentType);
				return;
			}
			const file = this.state.fileReader
			file.addEventListener('loadend', async (e) => {
				const result = e.target?.result
				if (result) {
					this.setState({ nftImagePreview: result })
					this.setState({ nftImageMimeType: contentType })
					this.setState({ inputNftImageUrl: '' })
				}
			})
			file.readAsDataURL(files[0])
		}
	}
	getPropertiesBlock() {

		if(!this.state.nftPropertiesDataTmp.length) {
			this.addNftEmptyProperty()
		}

		return (
			<div className="c-wrap">
				<button
					className="btn btn-outline"
					onClick={(e) => {
						this.setState({ nftPropertiesDataTmp: this.state.nftPropertiesData })
						this.setState({ nftPropertiesOpened: true })
					}}
				>
					{ this.t('Add properties') }
				</button>
				{ this.state.nftPropertiesData.length ? (
					<>
						<div className="input-label mt-5">Properties</div>
						<div className="c-wrap__table with-del-btn mt-3">
						{
							this.state.nftPropertiesData?.map((data, index)=>{
								const {type, name} = data
								return (
									<div
										key={index}
										className="item"
									>
										<div className="row">
											<div className="col-12 col-sm-5 mb-2">
												<span className="text-break text-muted">{type}</span>
											</div>
											<div className="col-12 col-sm-7 mb-2">
												<span className="text-break">{name}</span>
											</div>
											<button
												className="btn-del"
												onClick={() => { this.deleteNftProperties(index,false) }}
											><img src={ icon_i_del } alt="" /></button>
										</div>
									</div>
								)
							})
						}
						</div>
					</>
				) : null }
			</div>
		)
	}
	showNftProperties() {
		return (
			<div className="modal">
				<div className="modal__inner" onClick={ (e) => {
						e.stopPropagation()
						if ((e.target as HTMLTextAreaElement).className === 'modal__inner') {
							this.setState({ nftPropertiesOpened: false })
						}
					}}>
					<div className="modal__bg"></div>
					<div className="container">
						<div className="modal__content">
							<div
								className="modal__close"
								onClick={() => {
									this.setState({ nftPropertiesOpened: false })
								}}
							>
								<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path fill-rule="evenodd" clip-rule="evenodd" d="M35.9062 36.3802L0.69954 1.17351L1.25342 0.619629L36.4601 35.8263L35.9062 36.3802Z" fill="white"></path>
									<path fill-rule="evenodd" clip-rule="evenodd" d="M0.699257 36.3802L35.9059 1.17351L35.3521 0.619629L0.145379 35.8263L0.699257 36.3802Z" fill="white"></path>
								</svg>
							</div>
							<div className="modal__header">
								<div className="h2">NFT Properties</div>
								<div className="nft-property__form">
									<div className="row d-none d-sm-flex">
										<div className="col-sm-5">
											<div className="input-group">
												<label className="input-label">Trait</label>
											</div>
										</div>
										<div className="col-sm-5">
											<div className="input-group">
												<label className="input-label">Value</label>
											</div>
										</div>
									</div>
									{
										this.state.nftPropertiesDataTmp?.map((data, index)=>{
											const {type, name} = data
											return (
												<div
													key={index}
													className="row mb-4 mb-sm-0"
												>
													<div className="col-sm-5">
														<div className="input-group">
															<label className="input-label d-sm-none">Type </label>
															<input
																type="text"
																className="input-control"
																value={type}
																name="type"
																onChange={(e) => { this.changeNftProperties(index,e) }}
															/>
														</div>
													</div>
													<div className="col-sm-5">
														<div className="input-group">
															<label className="input-label d-sm-none">Name </label>
															<input
																type="text"
																className="input-control"
																value={name}
																name="name"
																onChange={(e) => { this.changeNftProperties(index,e) }}
															/>
														</div>
													</div>
													<div className="col-sm-2 col-del">
														<button
															className="btn-link px-0 btn-sm"
															onClick={() => { this.deleteNftProperties(index,true) }}
															> Delete</button>
													</div>
												</div>
											)
										})
									}
									<button
										className="btn btn-outline btn-sm w-auto"
										onClick={() => { this.addNftEmptyProperty() }}
									>Add more </button>
								</div>
								<div className="row mt-6">
									<div className="col-sm-5">
										<button
											className="btn w-100"
											onClick={() => {
												this.setState({ nftPropertiesData: this.state.nftPropertiesDataTmp });
												this.setState({ nftPropertiesOpened: false })
											}}
										>Save</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
	addNftEmptyProperty() {
		this.setState({ nftPropertiesDataTmp: [...this.state.nftPropertiesDataTmp, { type: '', name: '' }] })
	}
	deleteNftProperties(index: number, tmp: boolean) {
		if (tmp) {
			const data = [...this.state.nftPropertiesDataTmp]
			data.splice(index, 1)
			this.setState({ nftPropertiesDataTmp: data })
		}
		else {
			const data = [...this.state.nftPropertiesData]
			data.splice(index, 1)
			this.setState({ nftPropertiesData: data })
		}
	}
	changeNftProperties(i: number, e: React.ChangeEvent<HTMLInputElement>) {
		const {name, value} = e.target
		const data = [...this.state.nftPropertiesDataTmp]
		data[i][name as keyof typeof data[0]] = value
		this.setState({ nftPropertiesDataTmp: data })
	}
	getAdvancedOptionsBlock() {
		return (
			<div className="c-wrap p-0">
				<div
					className={`c-wrap__toggle ${this.state.advancedOptionsOpened ? 'active' : ''}`}
					onClick={() => {
						this.setState({
							advancedOptionsOpened: !this.state.advancedOptionsOpened
						})
					}}
				>
					<div><b>Advanced options</b></div>
				</div>
				<div className="c-wrap__dropdown">
					<div className="input-group pt-2 mb-0">
						<label className="input-label pb-1">Meta data hosting place:</label>
						<div className="mb-3">
							<label className="checkbox">
								<input type="radio" name="meta-hosting" checked />
								<span className="check"> </span>
								<span className="check-text">Swarm
									<Tippy
										content={ this.t('Use Swarm decentralised data storage') }
										appendTo={ document.getElementsByClassName("wrapper")[0] }
										trigger='mouseenter'
										interactive={ false }
										arrow={ false }
										maxWidth={ 512 }
									>
										<span className="i-tip ml-1"></span>
									</Tippy>
								</span>
							</label>
						</div>
						<div className="mb-3">
							<label className="checkbox">
								<input type="radio" name="meta-hosting" disabled />
								<span className="check"> </span>
								<span className="check-text">Envelop
									<Tippy
										content={ this.t('Work on support is in progress') }
										appendTo={ document.getElementsByClassName("wrapper")[0] }
										trigger='mouseenter'
										interactive={ false }
										arrow={ false }
										maxWidth={ 512 }
									>
										<span className="i-tip ml-1"></span>
									</Tippy>
								</span>
							</label>
						</div>
						<div className="mb-3">
							<label className="checkbox">
								<input type="radio" name="meta-hosting" disabled />
								<span className="check"> </span>
								<span className="check-text">Unstopable NFT
									<Tippy
										content={ this.t('Work on support is in progress') }
										appendTo={ document.getElementsByClassName("wrapper")[0] }
										trigger='mouseenter'
										interactive={ false }
										arrow={ false }
										maxWidth={ 512 }
									>
										<span className="i-tip ml-1"></span>
									</Tippy>
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		)
	}
	getCopiesBlock() {
		const showError = this.state.showErrors.find((item) => { return item === 'inputCopies' });
		if ( this.state.inputStandart === _AssetType.ERC1155 ) {
			return (
				<div className="col-12 col-lg-3">

					<div className="input-group mb-md-0">
						<label className="input-label">Supply for each</label>
						<input
							className={`input-control ${ showError ? 'has-error' : '' }`}
							type="text"
							value={ this.state.inputCopies }
							onChange={(e) => {
								const value = e.target.value.replaceAll(' ', '');
								this.setState({
									inputCopies: value,
									showErrors: this.state.showErrors.filter((item) => { return item !== 'inputCopies' })
								});
								return;
							}}
						/>
					</div>
				</div>
			)
		}
	}
	getBatchBlock() {
		const showError = this.state.showErrors.find((item) => { return item === 'inputBatch' });
		return (
			<div className="col-12 col-lg-3">

				<div className="input-group mb-md-0">
					<label className="input-label">Batch amount</label>
					<input
						className={`input-control ${ showError ? 'has-error' : '' }`}
						type="text"
						value={ this.state.inputBatch }
						onChange={(e) => {
							const value = e.target.value.replaceAll(' ', '');
							this.setState({
								inputBatch: value,
								showErrors: this.state.showErrors.filter((item) => { return item !== 'inputCopies' })
							});
							return;
						}}
					/>
				</div>
			</div>
		)
	}
	getStandartSelectorBlock() {

		const eipPrefix = this.state.EIPPrefix ? this.state.EIPPrefix : 'ERC'

		return (
			<div
				className="c-wrap"
				ref={ (e) => { this.scrollable.standart = e } }
			>
				<div className="row">
					<div className="col-12 col-lg-5">
						<div className="input-group mb-md-0">
							<label className="input-label">NFT Standard</label>
							<div className="row row-sm">
								<div className="col-auto my-2">
									<label className="checkbox">
										<input
											type="radio"
											name="nft-standard"
											value={ _AssetType.ERC721 }
											checked={ this.state.inputStandart === _AssetType.ERC721 }
											onChange={() => { this.setState({ inputStandart: _AssetType.ERC721 }) }}
										/>
										<span className="check"> </span>
										<span className="check-text"><b>{ eipPrefix }-721</b></span>
									</label>
								</div>
								<div className="col-auto my-2">
									<label className="checkbox">
										<input
											type="radio"
											name="nft-standard"
											value={ _AssetType.ERC1155 }
											checked={ this.state.inputStandart === _AssetType.ERC1155 }
											onChange={() => { this.setState({ inputStandart: _AssetType.ERC1155 }) }}
										/>
										<span className="check"> </span>
										<span className="check-text"> <b>{ eipPrefix }-1155</b></span>
									</label>
								</div>
							</div>
						</div>
					</div>
					{ this.getCopiesBlock() }
					{ this.getBatchBlock() }
				</div>
			</div>
		)
	}
	savingMetadataModal() {
		return (
			<div className="modal">
				<div className="modal__inner" onClick={ (e) => {
					e.stopPropagation()
					if ((e.target as HTMLTextAreaElement).className === 'modal__inner') {
						this.setState({ savingMetadataOpened: false })
					}
				}}>
					<div className="modal__bg"></div>
					<div className="container">
						<div className="modal__content">
							<div
								className="modal__close"
								onClick={() => {
									this.setState({ savingMetadataOpened: false })
								}}
							>
								<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path fill-rule="evenodd" clip-rule="evenodd" d="M35.9062 36.3802L0.69954 1.17351L1.25342 0.619629L36.4601 35.8263L35.9062 36.3802Z" fill="white"></path>
									<path fill-rule="evenodd" clip-rule="evenodd" d="M0.699257 36.3802L35.9059 1.17351L35.3521 0.619629L0.145379 35.8263L0.699257 36.3802Z" fill="white"></path>
								</svg>
							</div>
							<div className="modal__header">
								<div className="h2">Creating your NFT </div>
							</div>
							<div className="c-approve">
								<div className={`c-approve__step ${ this.state.swarmNftImageUrl ? 'in-queue' : 'active' }`}>
									<div className="row">
										<div className="col-12 col-sm-auto order-2 order-sm-1"><span className="ml-2">Saving your metadata<span className="dots">...</span></span> </div>
										<div className="col-12 col-sm-auto order-1 order-sm-1">
											<div className="status"><img className={ !this.state.swarmNftImageUrl ? 'loader' : '' } src={ icon_loader } alt="" /></div>
										</div>
									</div>
								</div>
								{ this.savingMetadataQueue() }
								{ this.mintingStatusQueue() }
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
	savingMetadataQueue() {
		if(this.state.swarmNftImageUrl && this.state.swarmNftJsonUrl) {
			const nft_txid = this.state.mintedNftTxId
			return(
							<div className={`c-approve__step ${ nft_txid ? 'in-queue' : 'active' }`}>
								<div className="row">
									<div className="col-12 col-sm-auto order-2 order-sm-1"><span className="ml-2">Minting NFT for you<span className="dots">...</span></span> </div>
									<div className="col-12 col-sm-auto order-1 order-sm-1">
										<div className="status"><img className={ !nft_txid ? 'loader' : '' } src={ icon_loader } alt="" /></div>
									</div>
								</div>
							</div>
			)
		}
	}
	mintingStatusQueue() {
		if(this.state.swarmNftJsonUrl && this.state.mintedNftTxId) {
			const nft_txid = this.state.mintedNftTxId
			return(
							<div className="c-approve__step active">
								<div className="row">
									<div className="col-12 col-sm-auto order-2 order-sm-1"><span className="ml-2">Minted with transaction ID: <a href={ `${this.state.explorerBaseUrl}/tx/` + nft_txid } target="_blank" rel="noreferrer">{ this.shortenHash(nft_txid) }</a></span> </div>
									<div className="col-12 col-sm-auto order-1 order-sm-1">
										<div className="status"><img className={ !nft_txid ? 'loader' : '' } src={ icon_loader } alt="" /></div>
									</div>
								</div>
							</div>
			)
		}
	}
	shortenHash(hash: any) {
		return hash.substring(0, 4) + "..." + hash.substring(hash.length - 4, hash.length)
	}
	hasErrors() {

		const errors: Array<{ msg: string, block: HTMLElement, showError?: string }> = [];

		if (!this.state.nftImagePreview) {
			if (!this.state.inputNftImageUrl) {
				errors.push({ msg: 'Add a local file  or an external URL', block: this.scrollable.generalInfo })
			}
			else {
				errors.push({ msg: 'Wrong URL', block: this.scrollable.generalInfo })
			}
		}

		if (!this.state.inputNftInfoName) {
			errors.push({ msg: 'Add NFT name', block: this.scrollable.generalInfo })
		}

		if (!this.state.inputNftInfoDesc) {
			errors.push({ msg: 'Add NFT description', block: this.scrollable.generalInfo })
		}

		if (isNaN(+this.state.inputBatch) || +this.state.inputBatch < 1) {
			errors.push({ msg: 'Correct batch amount value', block: this.scrollable.standart })
		}

		if (isNaN(+this.state.inputCopies) || +this.state.inputCopies < 1) {
			errors.push({ msg: 'Correct supply amount value', block: this.scrollable.standart })
		}

		return errors;
	}
	getErrorsBlock() {
		const errors = this.hasErrors();

		if ( !errors.length ) { return null; }

		return (
			<div className="c-errors mt-4">
				<div className="mb-3">To enable Create button, correct the following errors:</div>
				<ul>
				{
					errors.map((item) => {
						return (
							<li key={ item.msg }>
								<button
									className="btn-link"
									onClick={() => {
										item.block.scrollIntoView();
										if ( item.showError ) {
											this.setState({
												showErrors: [
													...this.state.showErrors.filter((iitem) => { return iitem !== item.showError }),
													item.showError
												]
											})
										}
									}}
								>
									{ item.msg }
								</button>
							</li>
						)
					})
				}
				</ul>
			</div>
		)
	}
	getCreateBtn() {
		return (
			<button
				className="btn btn-lg w-100"
				disabled={
					!!this.hasErrors().length
				}
				onClick={() => { this.createSubmit(); }}
			>{ this.t('Create') }</button>
		)
	}
	async createSubmit() {
		if ( !this.nftMinterContract ) { return; }

		this.setState({ savingMetadataOpened: true });
		// unset txid if any previous stored
		this.setState({ mintedNftTxId: '' });

		// Save data with Swarm
		const swarmData = await fetchSwarmStamp({
			name: this.state.inputNftInfoName,
			desc: this.state.inputNftInfoDesc,
			image: this.state.nftImagePreview.toString(),
			mime: this.state.nftImageMimeType,
			props: this.state.nftPropertiesData
		});
		if ( swarmData ) {
			if ('image' in swarmData) {
				if (typeof swarmData['image'] === "string") {
					this.setState({ swarmNftImageUrl: swarmData['image'] });
				}
			}
			if ('json' in swarmData) {
				if (typeof swarmData['json'] === "string") {
					this.setState({ swarmNftJsonUrl: swarmData['json'] });
				}

				// prepare form data
				const inputStandart = ( this.state.inputStandart === _AssetType.ERC721 ) ? 721 : 1155;
				const inputBatch = ( isNaN(+this.state.inputBatch) ) ? 1 : Number(this.state.inputBatch);
				const inputCopies = ( isNaN(+this.state.inputCopies) ) ? 1 : Number(this.state.inputCopies);

				// get NFT last ID
				await this.nftMinterContract.getTotalSupply({
					standart: inputStandart
				}).then( async lastTokenId => {
					const nextTokenId = Number(lastTokenId) + 1;

					console.log("NFT token URI: " + this.state.swarmNftJsonUrl);

					let oracleSignature: any = await getOracleNftMinterSign({
						address: this.state.userAddress,
						chain_id: this.state.chainId,
						token_id: nextTokenId,
						token_uri: this.state.swarmNftJsonUrl,
						batch: inputBatch,
						amount: inputCopies,
						standart: inputStandart
					});

					if ( !oracleSignature ) {

						this.setState({ savingMetadataOpened: false });

						this.store.dispatch(setError({
							text: `${this.t('Cannot mint token')} ${this.t('No oracle signature')}`,
							buttons: undefined,
							links: undefined,
						}));
					}
					else {
						const oracle_signature = oracleSignature.oracle_signature;

						// mint that NFT
						this.nftMinterContract?.mintWithURI({
							tokenId: nextTokenId,
							tokenURI: this.state.swarmNftJsonUrl,
							batch: inputBatch,
							amount: inputCopies,
							standart: inputStandart,
							oracleSignature: oracle_signature,
							userAddress: this.state.userAddress,
						})
						.then((data: any) => {
							if ('transactionHash' in data) {
								console.log("Minted with txid " + data['transactionHash']);

								// get minted token IDs and contract address
								let viewNftTokenId = '';
								// let viewNftLastTokenId = 0;
								let viewNftContract = '';
								let viewNftObject = [];
								let tokenIds = [];

								viewNftObject = ( inputStandart === 721 ) ? data.events.Transfer : data.events.TransferSingle;

								if( viewNftObject.length > 1 ) {
									viewNftObject.map( (item:any) => tokenIds.push( ( inputStandart === 721 ) ? item.returnValues.tokenId : item.returnValues.id ) );
									viewNftContract = viewNftObject[0].address;
								}
								else {
									tokenIds.push( ( inputStandart === 721 ) ? viewNftObject.returnValues.tokenId : viewNftObject.returnValues.id );
									viewNftContract = viewNftObject.address;
								}

								viewNftTokenId = tokenIds.map(i => i).join(',');
								// viewNftLastTokenId = Number(tokenIds.pop());

								this.setState({ mintedNftContract: viewNftContract });
								this.setState({ mintedNftTxId: data.transactionHash });

								this.store.dispatch(setInfo({
									text: [
										`${this.t('NFT has been minted')} ${viewNftContract}:${viewNftTokenId}`,
										`${this.t('You can see all your NFTs on dashboard.')}`,
									],
									buttons: [
										{
											text: `Go to dashboard`,
											clickFunc: () => { window.location.href = `/list`; }
										},
										{
											text: 'Close',
											clickFunc: () => { this.store.dispatch(clearInfo()); }
										},
									],
									links: [{
										text: `View on ${this.state.explorerName}`,
										url: `${this.state.explorerBaseUrl}tx/${data.transactionHash}`
									}]
								}));

								this.unsetFormValues();

							}
							else {
								console.log('No TxID in response');
								this.store.dispatch(setError({
									text: `${this.t('Cannot mint NFT. Please try again.')}`,
									buttons: [
										{
											text: this.t('Close'),
											clickFunc: async () => {
												window.location.href = '/mint';
												this.unsetFormValues();
												this.store.dispatch(clearError());
											}
										},
									],
									links: undefined,
								}));
							}
						})
						.catch((e: any) => {
							console.log('Cannot mint NFT', e);
							this.store.dispatch(setError({
								text: `${this.t('Cannot mint NFT')}, ${e.message}`,
								buttons: [
									{
										text: this.t('Close'),
										clickFunc: async () => {
											window.location.href = '/mint';
											this.unsetFormValues();
											this.store.dispatch(clearError());
										}
									},
								],
								links: undefined,
							}));
						});
					}
				});
			}
		} else {
			console.log("Error with saving metadata to Swarm");
			this.store.dispatch(setError({
				text: this.t(`There was an error with saving metadata to Swarm. Please try again.`),
				buttons: [
					{
						text: this.t('Close'),
						clickFunc: async () => {
							window.location.href = '/mint';
							this.unsetFormValues();
							this.store.dispatch(clearError());
						}
					},
				],
				links: undefined
			}));
		}
	}
	unsetFormValues() {
		this.setState({ savingMetadataOpened: false });
		this.setState({ inputNftInfoName: '' });
		this.setState({ inputNftInfoDesc: '' });
		this.setState({ inputNftImageUrl: '' });
		this.setState({ fileReader: new FileReader() });
		this.setState({ nftImagePreview: '' });
		this.setState({ nftImageMimeType: '' });
		this.setState({ nftPropertiesData: [] });
		this.setState({ inputBatch: '1' });
		this.setState({ inputCopies: '1' });
		this.setState({ swarmNftImageUrl: '' });
		this.setState({ swarmNftJsonUrl: '' });
	}

	render() {
		return (
			<>
				<main className="s-main">
					<div className="container">
						<div className="wrap__header d-flex justify-content-between">
							<div className="h3 mt-0">Create NFT</div>
							{
								this.closePageFunction ? (
									<button
										className="btn btn-outline"
										onClick={() => { if (this.closePageFunction) { this.closePageFunction( this.state.mintedNftContract ) }}}
									>Back to SAFT</button>
								) : null
							}
						</div>
						{ this.getGeneralInfoBlock() }
						<div className="row">
							<div className="col-md-7 col-lg-8">
								{ this.getPropertiesBlock() }
								{ this.getStandartSelectorBlock() }
							</div>
							<div className="col-md-5 col-lg-4">
								{ this.getAdvancedOptionsBlock() }
								{ this.getErrorsBlock() }
							</div>
							<div className="col-12 col-md-7 col-lg-4">
								{ this.getCreateBtn() }
							</div>
						</div>
					</div>
				</main>
				{ this.state.nftPropertiesOpened ? this.showNftProperties() : null }
				{ this.state.savingMetadataOpened ? this.savingMetadataModal() : null }
			</>
		)
	}
}

export default withTranslation("translations")(withRouter(MintPage));