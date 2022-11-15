
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

export const tokenToFloat = (value: BigNumber, decimals?: number): BigNumber => {
	const decimalsToParse = decimals || 18;
	return value.multipliedBy( 10**-decimalsToParse );
}

export const  tokenToInt = (value: BigNumber, decimals?: number): BigNumber => {
	const decimalsToParse = decimals || 18;
	return value.multipliedBy( 10**decimalsToParse );
}

export const addThousandSeparator = ( numStr: string ): string => {
	const parts = numStr.split(".");
	return parts[0]
		.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
		+ (parts[1] ? "." + parts[1] : "")
		+ ( numStr.endsWith('.') ? '.' : '' );
}
export const removeThousandSeparator = ( numStr: string ): string => {
	return numStr.replaceAll(',', '.').replaceAll(' ', '');
}

export const compactString = (str: string, chars?: number, saveFirst?: number) => {
	if ( !str   ) { return str }
	const useChars = chars || 3;

	str = `${str}`;
	if ( saveFirst && str.length < useChars*2+2+saveFirst ) { return str }
	if ( str.length < useChars*2+2 ) { return str }

	if ( saveFirst ) {
		return `${str.slice(0,useChars+saveFirst)}...${str.slice(-useChars)}`
	}

	return `${str.slice(0,useChars)}...${str.slice(-useChars)}`
}

export const monthesNames = [
	'jan',
	'feb',
	'mar',
	'apr',
	'may',
	'june',
	'july',
	'aug',
	'sept',
	'oct',
	'nov',
	'dec',
];

export const unixtimeToStr = (unixtime: BigNumber): string => {
	const date = new Date(unixtime.toNumber());
	return `${date.getDate()} ${monthesNames[date.getMonth()]} ${date.getFullYear()}`;
}
export const dateToUnixtime = (indate: Date): BigNumber => {
	return new BigNumber(indate.getTime()).dividedToIntegerBy(1000);
}

export const getABI = (chainId: number, contractAddress: string, typeName?: string) => {
	let ABI = undefined;

	try { ABI = require(`../../abis/${chainId}/${contractAddress              }.json`) } catch(ignored) {}
	if ( ABI ) { return ABI }

	try { ABI = require(`../../abis/${chainId}/${contractAddress.toLowerCase()}.json`) } catch(ignored) {}
	if ( ABI ) { return ABI }

	try { ABI = require(`../../abis/${contractAddress                         }.json`) } catch(ignored) {}
	if ( ABI ) { return ABI }

	try { ABI = require(`../../abis/${contractAddress.toLowerCase()           }.json`) } catch(ignored) {}
	if ( ABI ) { return ABI }

	try { ABI = require(`../../abis/${typeName || ''                          }.json`) } catch(ignored) {}
	if ( ABI ) { return ABI }

	throw new Error(`Cannot load ${chainId}/${contractAddress} abi`);
}