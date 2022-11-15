
import {
	ChainParamsType,
} from '../models/BlockchainAdapter';

import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

export enum _AdvancedLoadingStatus {
	queued,
	loading,
	complete,
};
export type AdvancedLoaderType = {
	title: string,
	stages: Array<AdvancedLoaderStageType>
};
export type AdvancedLoaderStageType = {
	id: string,
	sortOrder: number,
	current?: number,
	total?: number,
	text: string,
	status: _AdvancedLoadingStatus
};

type StateType = {
	currentPage      : string,
	gotoListRequested: boolean,
	_loading         : string,
	_advancedLoading : undefined | AdvancedLoaderType,
	_error           : undefined | {
		title? : string,
		text   : string | Array<string>,
		buttons: undefined | Array<{
			text     : string,
			clickFunc: Function,
		}>,
		links: undefined | Array<{
			text: string,
			url : string,
		}>,
	},
	_info    : undefined | {
		text   : string | Array<string>,
		buttons: undefined | Array<{
			text     : string,
			clickFunc: Function,
		}>,
		links: undefined | Array<{
			text: string,
			url : string,
		}>,
	},
	account: {
		address      : String,
		balanceNative: BigNumber,
	},
	metamaskAdapter: {
		logged              : Boolean,
		metamaskNotInstalled: Boolean,
		permissionRejected  : Boolean,
		chainId             : Number,
		requestChainId      : number | undefined,
		availableChains     : Array<ChainParamsType>,
		authMethod          : string,
	},
};

export const initialState: StateType = {
	currentPage      : '',
	gotoListRequested: false,
	_loading         : '',
	_advancedLoading : undefined,
	_error           : undefined,
	_info            : undefined,
	account          : {
		address      : '',
		balanceNative: new BigNumber(0),
	},
	metamaskAdapter: {
		logged              : false,
		metamaskNotInstalled: false,
		permissionRejected  : false,
		chainId             : 0,
		requestChainId      : undefined,
		availableChains     : [],
		authMethod          : '',
	},
}

export const reducer = (state = initialState, action: any): StateType => {

	switch ( action.type ) {

		// ---------- NAVIGATION ----------
		case 'GOTO_MAIN': {
			return {
				...state,
				currentPage: '',
			}
		}
		case 'GOTO_PREVIEW': {
			return {
				...state,
				currentPage: 'preview',
			}
		}
		case 'GOTO_LIST': {
			return {
				...state,
				currentPage: 'list',
			}
		}
		case 'SET_LOADING': {
			return {
				...state,
				_loading: action.payload.msg,
			}
		}
		case 'UNSET_LOADING': {
			return {
				...state,
				_loading: '',
				_advancedLoading: undefined,
			}
		}
		case 'CREATE_ADVANCED_LOADING': {
			return {
				...state,
				_advancedLoading: action.payload,
			}
		}
		case 'CLEAR_ADVANCED_LOADING': {
			return {
				...state,
				_advancedLoading: undefined,
			}
		}
		case 'UPDATE_STEP_ADVANCED_LOADING': {
			if ( !state._advancedLoading ) { return state; }

			return {
				...state,
				_advancedLoading: {
					...state._advancedLoading,
					stages: [
						...state._advancedLoading.stages.filter((item) => {
							return item.id.toLowerCase() !== action.payload.id.toLowerCase()
						}),
						action.payload
					]
				},
			}
		}
		case 'SET_ERROR': {
			return {
				...state,
				_error: action.payload,
			}
		}
		case 'CLEAR_ERROR': {
			return {
				...state,
				_error: undefined,
			}
		}
		case 'SET_INFO': {
			return {
				...state,
				_info: action.payload,
			}
		}
		case 'CLEAR_INFO': {
			return {
				...state,
				_info: undefined,
			}
		}
		case 'RESET_APP_DATA': {
			return {
				...initialState,
				currentPage: state.currentPage === 'list' ? state.currentPage : initialState.currentPage,
				metamaskAdapter: {
					...initialState.metamaskAdapter,
					availableChains: state.metamaskAdapter.availableChains,
				}
			};
		}
		case 'GOTO_LIST_REQUEST': {
			return {
				...state,
				gotoListRequested: true,
			}
		}
		case 'GOTO_LIST_RESOLVE': {
			return {
				...state,
				gotoListRequested: false,
				currentPage: state.currentPage === '' ? 'list' : state.currentPage,
			}
		}
		// ---------- END NAVIGATION ----------
		// ---------- CONNECTION ----------
		case 'METAMASK_CONNECTION_SUCCESS': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					metamaskNotInstalled: false,
					permissionRejected  : false,
					logged              : true,
				},
				account: {
					...state.account,
					address: action.payload.address,
				}
			}
		}
		case 'METAMASK_CONNECTION_NOT_INSTALLED': {
			return {
				...state,
				metamaskAdapter: {
					...initialState.metamaskAdapter,
					metamaskNotInstalled: true,
				}
			}
		}
		case 'METAMASK_CONNECTION_REJECTED': {
			return {
				...state,
				metamaskAdapter: {
					...initialState.metamaskAdapter,
					permissionRejected: true,
					authMethod: state.metamaskAdapter.authMethod,
				}
			}
		}
		case 'METAMASK_SET_CHAIN_PARAMS': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					...action.payload,
				}
			}
		}
		case 'METAMASK_SET_AVAILABLE_CHAINS': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					availableChains: action.payload,
				}
			}
		}
		case 'SET_AUTH_METHOD': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					authMethod: action.payload,
				}
			}
		}
		case 'UNSET_AUTH_METHOD': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					authMethod: '',
				}
			}
		}
		case 'REQUEST_CHAIN': {
			return {
				...state,
				metamaskAdapter: {
					...state.metamaskAdapter,
					requestChainId: action.payload,
				}
			}
		}
		// ---------- END CONNECTION ----------

		// ---------- NATIVE TOKEN ----------
		case 'UPDATE_NATIVE_BALANCE': {
			return {
				...state,
				account: {
					...state.account,
					balanceNative: action.payload.balance,
				}
			}
		}
		// ---------- END NATIVE TOKEN ----------

		default: { return state }

	}
}