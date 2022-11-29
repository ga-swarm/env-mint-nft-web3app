
import { default as urljoin } from 'url-join';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

export type APIOracleSign = {
	oracle_signature: string,
	oracle_signer: string,
	sender: string,
	source_chain: number,
	source_keeper: string,
	target_chain: number,
	target_contract: string,
	target_token_id: string,
	tx_hash: string,
}
export type SwarmStampBatchId = {
	name: string,
	desc: string,
}

const createAuthToken = async () => {

	async function sha256(message: string) {
		const msgBuffer = new TextEncoder().encode(message);
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	}
	async function signTimed(name: string, key: string) {
		const now = new Date().getTime();
		const timeBlock = parseInt(`${now / (parseInt(key_active || '0') * 1000)}`);

		return sha256(name+key+timeBlock)
	}

	const app_name   = window.location.host;
	const app_id     = process.env.REACT_APP_ORACLE_APP_ID;
	const app_key    = process.env.REACT_APP_ORACLE_APP_KEY;
	const key_active = process.env.REACT_APP_ORACLE_KEY_ACTIVE_TIME;

	if ( !app_id || !app_key || !key_active ) {
		console.log('No app_id or app_key of key_active in .env');
		return '';
	}
	const tempKey = await signTimed(app_name, app_key);

	return `${app_id}.${tempKey}`
}

export const getOracleNftMinterSign = async (params: {
	address: string,
	chain_id: number,
	token_id: number,
	token_uri: string,
	batch: number,
	amount: number,
	standart: number
}):Promise<APIOracleSign | undefined> => {

	const authToken = await createAuthToken();
	if ( authToken === '' ) {
		console.log('Cannot create token');
		return undefined;
	}

	const BASE_URL = process.env.REACT_APP_ORACLE_API_BASE_URL;
	if ( !BASE_URL ) { console.log('No oracle base url in .env'); return undefined; }

	const url  = urljoin(BASE_URL, '/web3/mintsign');

	let respParsed: APIOracleSign;

	try {
	    const requestOptions = {
	        method: 'POST',
	        headers: {
	        	'Authorization': authToken,
	        	'Content-Type': 'application/json'
	        },
	        body: JSON.stringify({
	        	address: params.address,
	        	chainId: params.chain_id,
	        	tokenId: params.token_id.toString(),
	        	tokenURI: params.token_uri,
	        	batch: params.batch,
	        	amount: params.amount,
	        	standart: params.standart
	        })
	    };
		const resp = await fetch(url, requestOptions);
		respParsed = await resp.json();
	} catch (e) {
		console.log('Cannot fetch oracle signature', e);
		return undefined;
	}

	if ( !respParsed || 'error' in respParsed ) { return undefined; }

	return respParsed;
}

export const fetchSwarmStamp = async (params: {
	name: string,
	desc: string,
	image: string | ArrayBuffer,
	mime: string,
	props: Array<{
		type: string,
		name: string
	}>
}):Promise<Array<SwarmStampBatchId> | undefined> => {

	const authToken = await createAuthToken();
	if ( authToken === '' ) {
		console.log('Cannot create token');
		return undefined;
	}

	let BASE_URL = process.env.REACT_APP_ORACLE_API_MINT_URL;
	let url = BASE_URL || '';
	if ( !BASE_URL ) {
		BASE_URL = process.env.REACT_APP_ORACLE_API_BASE_URL;
		if ( !BASE_URL ) { console.log('No oracle mint url in .env'); return undefined; }
		url = urljoin(BASE_URL, `mint/`);
	}
	url  = urljoin(url, `new/`);

	let respParsed: Array<SwarmStampBatchId>;

	try {
	    const requestOptions = {
	        method: 'POST',
	        headers: {
	        	'Authorization': authToken,
	        	'Content-Type': 'application/json'
	        },
	        body: JSON.stringify({
	        	name: params.name,
	        	desc: params.desc,
	        	image: params.image,
	        	mime: params.mime,
	        	props: params.props
	        })
	    };
		const resp = await fetch(url, requestOptions);
		respParsed = await resp.json();
	} catch (e) {
		console.log('Cannot post newly created NFT data', e);
		return undefined;
	}

	if ( !respParsed || 'error' in respParsed ) { return undefined; }

	return respParsed;
}
