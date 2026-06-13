import * as types from './action-types';

import EndPoints from '../../services/EndPoints';
import axiosinstance from '../../axios/axiosinstance';

export const SEND_OTP = (mobile) => async (dispatch) => {
  dispatch({ type: types.SEND_OTP_REQUEST });
console.log('mobile',mobile);

  try {
    const response = await axiosinstance.post(EndPoints.sendOtp, { mobile });
console.log('response',response);

    if (response.data.success) {
      dispatch({
        type: types.SEND_OTP_SUCCESS,
        payload: response.data,
      });
    }

    return response.data;
  } catch (error) {
    console.log('error',error);
    
    dispatch({
      type: types.SEND_OTP_FAILURE,
       payload: error.message,
    });
    throw error;
  }
};

// VERIFY OTP
export const VERIFY_OTP = (mobile, otp) => async (dispatch) => {
  dispatch({ type: types.VERIFY_OTP_REQUEST });

  try {
    const response = await axiosinstance.post(EndPoints.verifyOtp, {
      mobile,
      otp,
    });

    if (response.data.token) {
      dispatch({
        type: types.VERIFY_OTP_SUCCESS,
        payload: response.data,
      });
    }

    return response.data;
  } catch (error) {
    dispatch({
      type: types.VERIFY_OTP_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};


export const GET_ALL_SERVICES = () => (dispatch) => {
  return axiosinstance.get('/allservices')
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('GET_ALL_SERVICES Request Error:', error);
      throw error;
    });
};

// GET SUB SERVICES
export const GET_SUB_SERVICES = (service_id) => async (dispatch) => {
  dispatch({ type: types.GET_SUB_SERVICES_REQUEST });

  try {
    const response = await axiosinstance.get(`allsubservices/${service_id}`);
    dispatch({
      type: types.GET_SUB_SERVICES_SUCCESS,
      payload: response.data.data,
    });
    console.log('responeresponse',response.data.data);
    
    return response.data.data;
  } catch (error) {
    console.log('GET_SUB_SERVICES Error:', error);
    dispatch({
      type: types.GET_SUB_SERVICES_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// GET PLANS by sub-service
export const GET_PLANS = (service_id, sub_service_id) => async (dispatch) => {
  dispatch({ type: types.GET_PLANS_REQUEST });

  try {
    const response = await axiosinstance.get(`plans/${service_id}/sub-service/${sub_service_id}`);
    console.log('GET_PLANS Response:', response);

    if (response.data.status) {
      dispatch({
        type: types.GET_PLANS_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.GET_PLANS_FAILURE,
        payload: response.data.message || 'Failed to fetch plans',
      });
    }

    return response.data;
  } catch (error) {
    console.log('GET_PLANS Error:', error);
    dispatch({
      type: types.GET_PLANS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// CREATE BOOKING
export const CREATE_BOOKING = (bookingData) => async (dispatch) => {
  dispatch({ type: types.CREATE_BOOKING_REQUEST });
  console.log('bookingData', bookingData);
  
  try {
    const response = await axiosinstance.post(EndPoints.createBooking, bookingData);
    console.log('CREATE_BOOKING Response:', response);
    
    if (response.data.status) {
      dispatch({
        type: types.CREATE_BOOKING_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.CREATE_BOOKING_FAILURE,
        payload: response.data.message || 'Booking failed',
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('CREATE_BOOKING Error:', error);
       console.log('UPDATE_USER_PROFILE Error:', error);
      console.log('error', error.response?.data);
      console.log('status', error.response?.status);
    dispatch({
      type: types.CREATE_BOOKING_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};


export const CREATE_BOOKING_PARCEL = (bookingData) => async (dispatch) => {
  dispatch({ type: types.CREATE_BOOKING_REQUEST });
  console.log('bookingData--->', bookingData);
  
  try {
    const response = await axiosinstance.post(EndPoints.createBookingParcel, bookingData);
    console.log('CREATE_BOOKING Response:', response);
    
    if (response.data.status) {
      dispatch({
        type: types.CREATE_BOOKING_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.CREATE_BOOKING_FAILURE,
        payload: response.data.message || 'Booking failed',
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('CREATE_BOOKING Error:', error);
       console.log('UPDATE_USER_PROFILE Error:', error);
      console.log('error', error.response?.data);
      console.log('status', error.response?.status);
    dispatch({
      type: types.CREATE_BOOKING_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// Clear booking data
export const CLEAR_BOOKING_DATA = () => (dispatch) => {
  dispatch({ type: types.CLEAR_BOOKING_DATA });
};

export const GET_INVOICE = (data) => async () => {
  try {
    const response = await axiosinstance.post(EndPoints.getInvoice, data);
    return response.data;
  } catch (error) {
    console.log('GET_INVOICE Error', error);
    return { status: false, message: error.response?.data?.message || 'Network error' };
  }
};

export const PROCESS_PAYMENT = (data) => async () => {
  try {
    const response = await axiosinstance.post(EndPoints.processPayment, data);
    return response.data;
  } catch (error) {
    console.log('PROCESS_PAYMENT Error', error);
    return { status: false, message: error.response?.data?.message || 'Network error' };
  }
};

export const GET_USER_CURRENT_BOOKING = () => (dispatch) => {
  return axiosinstance.get('/user/userCurrentBooking')
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('GET_USER_CURRENT_BOOKING Error:', error);
      throw error;
    });
};

// PAY TOKEN AMOUNT
export const PAY_TOKEN_AMOUNT = (paymentData) => (dispatch) => {
  return axiosinstance.post('/user/paytokenamount', paymentData)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('PAY_TOKEN_AMOUNT Error:', error);
      throw error;
    });
};

// PAY REMAINING BALANCE
export const PAY_REMAINING_BALANCE = (paymentData) => (dispatch) => {
  return axiosinstance.post('/user/payremainingBalance', paymentData)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('PAY_REMAINING_BALANCE Error:', error);
      throw error;
    });
};

export const PAY_TOPUP_AMOUNT = (paymentData) => (dispatch) => {
  return axiosinstance.post('user/payTopup', paymentData)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('PAY_TOPUP_AMOUNT Error:', error);
      throw error;
    });
};

export const CANCEL_BOOKING = (data) => (dispatch) => {
  console.log('data', data);

  return axiosinstance.post('/CancelBooking', data)
    .then((response) => {
      console.log('cancel Booking Response:', response.data);
      return response.data;
    })
    .catch((error) => {
      console.log('Cancel Booking Error:', error);
      console.log('error', error.response?.data);
      console.log('status', error.response?.status);
      throw error;
    });
};

export const GET_USER_PROFILE = () => (dispatch) => {
  return axiosinstance.get('/user/profile')
    .then((response) => {
      if (response.data?.status && response.data?.data) {
        dispatch({
          type: types.UPDATE_PROFILE,
          payload: response.data.data,
        });
      }
      return response.data;
    })
    .catch((error) => {
      console.log('GET_USER_PROFILE Error:', error);
      throw error;
    });
};

export const UPDATE_USER_PROFILE = (profileData) => (dispatch) => {
  console.log('profileData',profileData);
  
  return axiosinstance.put('/user/profile/update', profileData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
    .then((response) => {
      if (response.data?.status && response.data?.data) {
        dispatch({
          type: types.UPDATE_PROFILE,
          payload: response.data.data,
        });
      }
      return response.data;
    })
    .catch((error) => {
      console.log('UPDATE_USER_PROFILE Error:', error);
      console.log('error', error.response?.data);
      console.log('status', error.response?.status);
      throw error;
    });
};

// GET USER BOOKING HISTORY
export const GET_USER_BOOKING_HISTORY = () => (dispatch) => {
  return axiosinstance.get('/user/bookinghistory')
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('GET_USER_BOOKING_HISTORY Error:', error);
      return { status: false, message: error.message, data: [] };
    });
};

// GET USER PARCEL BOOKINGS / MY PARCELS
export const GET_MY_PARCELS = (page = 1, limit = 10) => (dispatch) => {
  return axiosinstance.get('/parcel/my-bookings', {
    params: {
      page,
      limit,
    },
  })
    .then((response) => {
      console.log('GET_MY_PARCELS Response:', response);
      return response.data;
    })
    .catch((error) => {
      console.log('GET_MY_PARCELS Error:', error);
      console.log('GET_MY_PARCELS Error:', error);
      console.log('error', error.response?.data);
      console.log('status', error.response?.status);
      return { status: false, message: error.message, data: [], pagination: null };
    });
};

// Parcel Pay Token
export const PAY_PARCEL_TOKEN = (payload) => async (dispatch) => {
  dispatch({ type: types.PAY_PARCEL_TOKEN_REQUEST });

  try {
    const response = await axiosinstance.post('/parcel/booking/pay-token', payload);

    if (response.data?.status) {
      dispatch({
        type: types.PAY_PARCEL_TOKEN_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.PAY_PARCEL_TOKEN_FAILURE,
        payload: response.data?.message || 'Token payment failed',
      });
    }

    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Network error';
    dispatch({
      type: types.PAY_PARCEL_TOKEN_FAILURE,
      payload: message,
    });
    throw new Error(message);
  }
};

// Parcel Pay Balance (Online/Cash)
export const PAY_PARCEL_BALANCE = (payload) => async (dispatch) => {
  dispatch({ type: types.PAY_PARCEL_BALANCE_REQUEST });

  try {
    const response = await axiosinstance.post('/parcel/booking/pay-balance', payload);

    if (response.data?.status) {
      dispatch({
        type: types.PAY_PARCEL_BALANCE_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.PAY_PARCEL_BALANCE_FAILURE,
        payload: response.data?.message || 'Balance payment failed',
      });
    }

    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Network error';
    dispatch({
      type: types.PAY_PARCEL_BALANCE_FAILURE,
      payload: message,
    });
    throw new Error(message);
  }
};

// Parcel Cancellation
export const CANCEL_PARCEL_BOOKING = ({ parcel_booking_id, cancel_reason }) => async (dispatch) => {
  dispatch({ type: types.CANCEL_PARCEL_BOOKING_REQUEST });

  try {
    const response = await axiosinstance.post('/parcel/booking/cancel', {
      parcel_booking_id,
      cancel_reason,
    });

    if (response.data?.status) {
      dispatch({
        type: types.CANCEL_PARCEL_BOOKING_SUCCESS,
        payload: response.data,
      });
    } else {
      dispatch({
        type: types.CANCEL_PARCEL_BOOKING_FAILURE,
        payload: response.data?.message || 'Cancel failed',
      });
    }

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message || 'Network error';

    dispatch({
      type: types.CANCEL_PARCEL_BOOKING_FAILURE,
      payload: message,
    });

    throw new Error(message);
  }
};


export const logout = () => (dispatch) => {
  dispatch({ type: types.LOGOUT_SUCCESS });
};

// SELF SHARING & INTER CITY ACTIONS

// Get Available Trips
export const GET_AVAILABLE_TRIPS = (fromCity, toCity, date, service_id) => async (dispatch) => {
  dispatch({ type: types.GET_AVAILABLE_TRIPS_REQUEST });
  console.log('GET_AVAILABLE_TRIPS Params:', { fromCity, toCity, date, service_id });

  try {
    const response = await axiosinstance.get(`/selfsharing/trips`, {
      params: {
        from_city: fromCity,
        to_city: toCity,
        date: date,
      },
    });
    console.log('GET_AVAILABLE_TRIPS Response:', response);
    if (response.data.status) {
      dispatch({
        type: types.GET_AVAILABLE_TRIPS_SUCCESS,
        payload: response.data.data,
      });
    } else {
      dispatch({
        type: types.GET_AVAILABLE_TRIPS_FAILURE,
        payload: response.data.message || 'Failed to fetch trips',
      });
    }

    return response.data;
  } catch (error) {
    console.log('GET_AVAILABLE_TRIPS Error:', error);
    dispatch({
      type: types.GET_AVAILABLE_TRIPS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// Create Self Sharing Booking
export const CREATE_SELF_SHARING_BOOKING = (bookingData, serviceType = 'selfsharing') => async (dispatch) => {
  dispatch({ type: types.CREATE_SELF_SHARING_BOOKING_REQUEST });

  try {
    const response = await axiosinstance.post(`/selfsharing/booking/create`, bookingData);

    if (response.data.status) {
      dispatch({
        type: types.CREATE_SELF_SHARING_BOOKING_SUCCESS,
        payload: response.data.data,
      });
    } else {
      dispatch({
        type: types.CREATE_SELF_SHARING_BOOKING_FAILURE,
        payload: response.data.message || 'Booking failed',
      });
    }

    return response.data;
  } catch (error) {
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    'Network error';

  dispatch({
    type: types.CREATE_SELF_SHARING_BOOKING_FAILURE,
    payload: errorMessage,
  });

  throw new Error(errorMessage);
};
};

// Get Self Sharing Bookings (My Bookings)
export const GET_SELF_SHARING_BOOKINGS = (serviceType = 'selfsharing', page = 1, limit = 10) => async (dispatch) => {
  dispatch({ type: types.GET_SELF_SHARING_BOOKINGS_REQUEST });

  try {
    const response = await axiosinstance.get(`/selfsharing/booking/my-bookings`, {
      params: {
        page,
        limit,
      },
    });

    if (response.data.status) {
      dispatch({
        type: types.GET_SELF_SHARING_BOOKINGS_SUCCESS,
        payload: response.data.data,
      });
    } else {
      dispatch({
        type: types.GET_SELF_SHARING_BOOKINGS_FAILURE,
        payload: response.data.message || 'Failed to fetch bookings',
      });
    }

    return response.data;
  } catch (error) {
    console.log('GET_SELF_SHARING_BOOKINGS Error:', error);
    dispatch({
      type: types.GET_SELF_SHARING_BOOKINGS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// Cancel Self Sharing Booking
export const CANCEL_SELF_SHARING_BOOKING = (bookingId, serviceType = 'selfsharing') => async (dispatch) => {
  dispatch({ type: types.CANCEL_SELF_SHARING_BOOKING_REQUEST });

  try {
    const response = await axiosinstance.post(`/selfsharing/booking/cancel`, {
      booking_id: bookingId,
    });

    if (response.data.status) {
      dispatch({
        type: types.CANCEL_SELF_SHARING_BOOKING_SUCCESS,
        payload: bookingId,
      });
    } else {
      dispatch({
        type: types.CANCEL_SELF_SHARING_BOOKING_FAILURE,
        payload: response.data.message || 'Cancel failed',
      });
    }

    return response.data;
  } catch (error) {
    console.log('CANCEL_SELF_SHARING_BOOKING Error:', error);
    dispatch({
      type: types.CANCEL_SELF_SHARING_BOOKING_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

// Pay Full Balance for Self Sharing Booking
export const PAY_FULL_BALANCE = (bookingId, paymentMode, serviceType = 'selfsharing') => async (dispatch) => {
  dispatch({ type: types.PAY_FULL_BALANCE_REQUEST });
console.log('PAY_FULL_BALANCE Params:', { bookingId, paymentMode, serviceType });
  try {
    const response = await axiosinstance.post(`/selfsharing/booking/pay-full`, {
      booking_id: bookingId,
      payment_mode: paymentMode,
    });

    if (response.data.status) {
      dispatch({
        type: types.PAY_FULL_BALANCE_SUCCESS,
        payload: response.data.data,
      });
    } else {
      dispatch({
        type: types.PAY_FULL_BALANCE_FAILURE,
        payload: response.data.message || 'Payment failed',
      });
    }

    return response.data;
  } catch (error) {
      const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    'Network error';

  dispatch({
    type: types.PAY_FULL_BALANCE_FAILURE,
    payload: errorMessage,
  });

  throw new Error(errorMessage);
   
  }
};
