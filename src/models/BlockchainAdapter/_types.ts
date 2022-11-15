import BigNumber  from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

export enum _AssetType {
	wNFTv0  = -1,
	empty   =  0,
	native  =  1,
	ERC20   =  2,
	ERC721  =  3,
	ERC1155 =  4
}
export const decodeAssetTypeFromString  = (str: string): _AssetType => {
	const strCleared = str
		.toLowerCase()
		.replaceAll('-', '')
		.replaceAll(' ', '')
		.replaceAll('_', '');
	if ( strCleared.includes('1155')   ) { return _AssetType.ERC1155; }
	if ( strCleared.includes('721')    ) { return _AssetType.ERC721 ; }
	if ( strCleared.includes('20')     ) { return _AssetType.ERC20  ; }
	if ( strCleared.includes('native') ) { return _AssetType.native ; }
	if ( strCleared.includes('wNFT')   ) { return _AssetType.wNFTv0 ; }
	return _AssetType.empty;
}
export const decodeAssetTypeFromIndex  = (str: string): _AssetType => {

	if ( str === '-1' ) { return _AssetType.wNFTv0;  }
	if ( str === '0'  ) { return _AssetType.empty;   }
	if ( str === '1'  ) { return _AssetType.native;  }
	if ( str === '2'  ) { return _AssetType.ERC20;   }
	if ( str === '3'  ) { return _AssetType.ERC721;  }
	if ( str === '4'  ) { return _AssetType.ERC1155; }

	return _AssetType.empty;
}
export const assetTypeToString  = (assetType: _AssetType, EIPPrefix: string): string => {

	if ( assetType === _AssetType.wNFTv0  ) { return 'wNFTv0'           ; }
	if ( assetType === _AssetType.empty   ) { return 'empty'            ; }
	if ( assetType === _AssetType.native  ) { return 'native'           ; }
	if ( assetType === _AssetType.ERC20   ) { return `${EIPPrefix}-20`  ; }
	if ( assetType === _AssetType.ERC721  ) { return `${EIPPrefix}-721` ; }
	if ( assetType === _AssetType.ERC1155 ) { return `${EIPPrefix}-1155`; }

	return 'empty';
}
export type _Asset = {
	assetType: _AssetType,
	contractAddress: string
}
export type _AssetItem = {
	asset: _Asset,
	tokenId: string,
	amount: string,
}

// ---------- SAFT ----------
export type SAFTSubscriptionType = {
	timelockPeriod   : BigNumber,
	ticketValidPeriod: BigNumber,
	counter          : number,
	isAvailable      : boolean,
}

export type SAFTPayOption = {
	paymentToken : string,
	paymentAmount: BigNumber,
	idx          : number,
}

export type SAFTTariff = {
	idx         : number,
	subscription: SAFTSubscriptionType,
	payWith     : Array<SAFTPayOption>,
	services    : Array<string>,
}
// ---------- END SAFT ----------