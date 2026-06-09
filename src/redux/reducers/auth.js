// src/redux/reducers/auth.js
import * as types from '../actions/action-types';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {


    case types.SIGN_IN_REQUEST:
    case types.SIGN_UP_REQUEST:
    case types.SEND_OTP_REQUEST:
    case types.VERIFY_OTP_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };


    case types.SIGN_IN_SUCCESS:
    case types.SIGN_UP_SUCCESS:
      return {
        ...state,
        user: action.payload.result || action.payload.user || null,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };


    case types.SEND_OTP_SUCCESS:
      return {
        ...state,
        isLoading: false,
      };


    case types.VERIFY_OTP_SUCCESS:
      return {
        ...state,
        user: action.payload.user || null, // your API doesn’t send user
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };


    case types.SIGN_IN_FAILURE:
    case types.SIGN_UP_FAILURE:
    case types.SEND_OTP_FAILURE:
    case types.VERIFY_OTP_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };


    case types.LOGOUT_SUCCESS:
      return initialState;


    case types.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

export default authReducer;