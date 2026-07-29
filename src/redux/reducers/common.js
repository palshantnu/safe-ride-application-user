// src/redux/reducers/common.js
import * as types from '../actions/action-types';
import {
  GET_NOTIFICATIONS_REQUEST,
  GET_NOTIFICATIONS_SUCCESS,
  GET_NOTIFICATIONS_FAILURE,
} from '../actions/action-types';
const initialState = {
  appLanguage: 'en',
  theme: 'light',
  subServices: [],
  subServicesLoading: false,
  subServicesError: null,
  plans: [],
  plansLoading: false,
  plansError: null,
  booking: null,
  bookingLoading: false,
  bookingError: null,
  bookingSuccess: false,
    notifications: [],
  notificationsLoading: false,
};

export const common = (state = initialState, action) => {
  switch (action.type) {
    case types.SET_APP_LANGUAGE:
      return {
        ...state,
        appLanguage: action.payload,
      };
    
    // GET SUB SERVICES
    case types.GET_SUB_SERVICES_REQUEST:
      return { ...state, subServicesLoading: true, subServicesError: null };

    case types.GET_SUB_SERVICES_SUCCESS:
      return {
        ...state,
        subServicesLoading: false,
        subServices: Array.isArray(action.payload) ? action.payload : [],
        subServicesError: null,
      };

    case types.GET_SUB_SERVICES_FAILURE:
      return { ...state, subServicesLoading: false, subServicesError: action.payload };

    // GET PLANS
    case types.GET_PLANS_REQUEST:
      return {
        ...state,
        plansLoading: true,
        plansError: null,
      };
    
    case types.GET_PLANS_SUCCESS:
      return {
        ...state,
        plansLoading: false,
        plans: action.payload.data || [],
        plansError: null,
      };
    
    case types.GET_PLANS_FAILURE:
      return {
        ...state,
        plansLoading: false,
        plansError: action.payload,
      };
    
    // CREATE BOOKING
    case types.CREATE_BOOKING_REQUEST:
      return {
        ...state,
        bookingLoading: true,
        bookingError: null,
        bookingSuccess: false,
      };
    
    case types.CREATE_BOOKING_SUCCESS:
      return {
        ...state,
        bookingLoading: false,
        booking: action.payload,
        bookingSuccess: true,
        bookingError: null,
      };
    
    case types.CREATE_BOOKING_FAILURE:
      return {
        ...state,
        bookingLoading: false,
        bookingError: action.payload,
        bookingSuccess: false,
      };
    
    // CLEAR BOOKING DATA
    case types.CLEAR_BOOKING_DATA:
      return {
        ...state,
        booking: null,
        bookingSuccess: false,
        bookingError: null,
      };
    
    case types.PAY_PARCEL_TOKEN_REQUEST:
      return { ...state, parcelPaymentLoading: true, parcelPaymentError: null };

    case types.PAY_PARCEL_TOKEN_SUCCESS:
      return { ...state, parcelPaymentLoading: false, parcelPaymentError: null };

    case types.PAY_PARCEL_TOKEN_FAILURE:
      return { ...state, parcelPaymentLoading: false, parcelPaymentError: action.payload };

    case types.PAY_PARCEL_BALANCE_REQUEST:
      return { ...state, parcelPaymentLoading: true, parcelPaymentError: null };

    case types.PAY_PARCEL_BALANCE_SUCCESS:
      return { ...state, parcelPaymentLoading: false, parcelPaymentError: null };

    case types.PAY_PARCEL_BALANCE_FAILURE:
      return { ...state, parcelPaymentLoading: false, parcelPaymentError: action.payload };
case types.CREATE_ONSPOT_BOOKING_REQUEST:
  return {
    ...state,
    bookingLoading: true,
    bookingSuccess: false,
    bookingError: null,
  };

case types.CREATE_ONSPOT_BOOKING_SUCCESS:
  return {
    ...state,
    bookingLoading: false,
    booking: action.payload,
    bookingSuccess: true,
    bookingError: null,
  };
 case GET_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        notificationsLoading: true,
      };
    case GET_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        notifications: action.payload?.data || [],
        notificationsLoading: false,
      };
    case GET_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        notificationsLoading: false,
      };
case types.CREATE_ONSPOT_BOOKING_FAILURE:
  return {
    ...state,
    bookingLoading: false,
    bookingSuccess: false,
    bookingError: action.payload,
  };
    default:
      return state;
  }
};
