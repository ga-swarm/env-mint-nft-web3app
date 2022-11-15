
import {
	ChainParamsType,
} from '../models/BlockchainAdapter';
import {
	AdvancedLoaderStageType,
	AdvancedLoaderType
} from './reducer';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

// ---------- NAVIGATION ----------
export const gotoMain = () => {
	return {
		type: 'GOTO_MAIN',
	}
}
export const gotoPreview = () => {
	return {
		type: 'GOTO_PREVIEW',
	}
}
export const gotoList = () => {
	return {
		type: 'GOTO_LIST',
	}
}
export const setLoading = (payload: { msg: string }) => {
	return {
		type: 'SET_LOADING',
		payload,
	}
}
export const unsetLoading = () => {
	return {
		type: 'UNSET_LOADING',
	}
}
export const createAdvancedLoading = (payload: AdvancedLoaderType) => {
	return {
		type: 'CREATE_ADVANCED_LOADING',
		payload,
	}
}
export const clearAdvancedLoading = () => {
	return {
		type: 'CLEAR_ADVANCED_LOADING',
	}
}
export const updateStepAdvancedLoading = (payload: AdvancedLoaderStageType) => {
	return {
		type: 'UPDATE_STEP_ADVANCED_LOADING',
		payload,
	}
}
export const setError = (payload: {
	title?: string,
	text  : string | Array<string>,
	buttons: undefined | Array<{
		text: string,
		clickFunc: Function,
	}>,
	links: undefined | Array<{
		text: string,
		url : string,
	}>
}) => {
	return {
		type: 'SET_ERROR',
		payload,
	}
}
export const clearError = () => {
	return {
		type: 'CLEAR_ERROR',
	}
}
export const setInfo = (payload: {
	title?: string,
	text  : string | Array<string>,
	buttons: undefined | Array<{
		text: string,
		clickFunc: Function,
	}>,
	links: undefined | Array<{
		text: string,
		url : string,
	}>
}) => {
	return {
		type: 'SET_INFO',
		payload,
	}
}
export const clearInfo = () => {
	return {
		type: 'CLEAR_INFO',
	}
}
export const resetAppData = () => {
	return {
		type: 'RESET_APP_DATA',
	}
}
export const gotoListRequest = () => {
	return {
		type: 'GOTO_LIST_REQUEST',
	}
}
export const gotoListResolve = () => {
	return {
		type: 'GOTO_LIST_RESOLVE',
	}
}
// ---------- END NAVIGATION ----------

// ---------- CONNECTION ----------
export const metamaskConnectionSuccess = (payload: { address: string }) => {
	return {
		type: 'METAMASK_CONNECTION_SUCCESS',
		payload,
	}
}
export const metamaskConnectionNotInstalled = () => {
	return {
		type: 'METAMASK_CONNECTION_NOT_INSTALLED',
	}
}
export const metamaskConnectionRejected = () => {
	return {
		type: 'METAMASK_CONNECTION_REJECTED',
	}
}
export const metamaskSetChainParams = (
	payload: {
		chainId?             : number | undefined,
		chainName?           : string,
		chainColorCode?      : string,
		chainRPCUrl?         : string,
		networkTokenTicket?  : string,
		EIPPrefix?           : string,
		networkTokenDecimals?: number,
		networkTokenIcon?    : string,
		isTestNetwork?       : Boolean,
		explorerBaseUrl?     : string,
		explorerName?        : string,
		nftMinterContract?   : string,
	}
) => {
	return {
		type: 'METAMASK_SET_CHAIN_PARAMS',
		payload,
	}
}
export const metamaskSetAvailableChains = ( payload: Array<ChainParamsType> ) => {
	return {
		type: 'METAMASK_SET_AVAILABLE_CHAINS',
		payload,
	}
}
export const setAuthMethod = ( payload: string ) => {
	return {
		type: 'SET_AUTH_METHOD',
		payload,
	}
}
export const unsetAuthMethod = () => {
	return {
		type: 'UNSET_AUTH_METHOD',
	}
}
export const requestChain = ( payload: number | undefined ) => {
	return {
		type: 'REQUEST_CHAIN',
		payload
	}
}
// ---------- END CONNECTION ----------

// ---------- NATIVE TOKEN ----------
export const updateNativeBalance = ( payload: { balance: BigNumber } ) => {
	return {
		type: 'UPDATE_NATIVE_BALANCE',
		payload,
	}
}
// ---------- END NATIVE TOKEN ----------