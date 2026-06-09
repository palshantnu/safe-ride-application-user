
import axiosinstance from '../axios/axiosinstance';
import EndPoints from './EndPoints';

export const loginService = (data) =>
  axiosinstance.post(EndPoints.authLogin, data);

export const signupService = (data) =>
  axiosinstance.post(EndPoints.signup, data);

export const fetchPagesByRole = (payload) =>
  axiosinstance.post(EndPoints.pagesByRole, payload).then((response) => response.data);

export const rechargeWallet = (data) =>
  axiosinstance.post(EndPoints.recharge, data);

export const getRechargeHistory = (page = 1, limit = 10) =>
  axiosinstance.get(`${EndPoints.rechargeHistory}?page=${page}&limit=${limit}`);

export const getWithdrawalHistory = (page = 1, limit = 10) =>
  axiosinstance.get(`${EndPoints.userWithdrawalHistory}?page=${page}&limit=${limit}`);

export const withdrawWallet = (data) =>
  axiosinstance.post(EndPoints.userWithdrawalRequest, data);

export default {
  loginService,
  signupService,
  fetchPagesByRole,
  rechargeWallet,
  getRechargeHistory,
  getWithdrawalHistory,
  withdrawWallet,
};