// src/redux/reducers/ride.js
import * as types from '../actions/action-types';

const initialState = {
  currentRide: null,
  rideHistory: [],
  isLoading: false,
  error: null,
};

const rideReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.BOOK_RIDE_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case types.BOOK_RIDE_SUCCESS:
      return {
        ...state,
        currentRide: action.payload,
        rideHistory: [action.payload, ...state.rideHistory],
        isLoading: false,
      };
    case types.BOOK_RIDE_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case types.CANCEL_RIDE:
      return {
        ...state,
        currentRide: null,
      };
    default:
      return state;
  }
};

export default rideReducer;