import { combineReducers } from 'redux';
import authReducer from './auth';
import commonReducer from './common';
import rideReducer from './ride';

const rootReducer = combineReducers({
  auth: authReducer,
  common: commonReducer,
  ride: rideReducer,
});

export default rootReducer;