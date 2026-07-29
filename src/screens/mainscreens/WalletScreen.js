  import React, { useState, useEffect, useCallback } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,

    ActivityIndicator,
    RefreshControl,
    StatusBar,
  } from 'react-native';
  import Icon from 'react-native-vector-icons/Ionicons';
  import RazorpayCheckout from 'react-native-razorpay';
  import { useSelector } from 'react-redux';
  import { rechargeWallet, getRechargeHistory, getWithdrawalHistory, withdrawWallet } from '../../services/Services';
  import CurvedHeader from '../../components/CurvedHeader';
  import LinearGradient from 'react-native-linear-gradient';

  const RAZORPAY_KEY = 'rzp_test_DUnz7sPsonIW95'; // Replace with your Razorpay key_id

  const WalletScreen = () => {
    const user = useSelector((state) => state.auth.user);

    const LIMIT = 10;

    const [balance, setBalance] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
    const [amount, setAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('upi');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [withdrawalHistory, setWithdrawalHistory] = useState([]);
    const [activeHistoryTab, setActiveHistoryTab] = useState('recharge');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [withdrawalHistoryLoading, setWithdrawalHistoryLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [hasMoreWithdrawals, setHasMoreWithdrawals] = useState(true);
const normaliseResponse = (res) => {
  const outer = res.data;
  const inner = outer?.data ?? outer;

  const list = Array.isArray(inner)
    ? inner
    : Array.isArray(inner?.result)
    ? inner.result
    : Array.isArray(inner?.data)
    ? inner.data
    : [];

  const bal =
    outer?.wallet_balance ??
    inner?.wallet_balance ??
    outer?.balance ??
    inner?.balance;

  const total =
    outer?.pagination?.total ??
    inner?.total ??
    list.length;

  return { list, bal, total };
};

    const fetchHistory = useCallback(async (resetPage = true) => {
      if (resetPage) {
        setHistoryLoading(true);
        setPage(1);
      }
      try {
        const currentPage = resetPage ? 1 : page;
        const res = await getRechargeHistory(currentPage, LIMIT);
        const { list, bal } = normaliseResponse(res);
  console.log('list',bal)
        if (resetPage) {
          setTransactions(list);
        } else {
          setTransactions(prev => [...prev, ...list]);
        }

        if (bal !== undefined && bal !== null) setBalance(bal);
        setHasMore(list.length === LIMIT);
      } catch (err) {
        console.log('Recharge history error:', err);
      } finally {
        setHistoryLoading(false);
        setLoadingMore(false);
      }
    }, [page]);

    useEffect(() => {
      fetchHistory(true);
      fetchWithdrawalHistory(true);
    }, [fetchHistory, fetchWithdrawalHistory]);

    const loadMore = async () => {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        const res = await getRechargeHistory(nextPage, LIMIT);
        const { list } = normaliseResponse(res);
        setTransactions(prev => [...prev, ...list]);
        setHasMore(list.length === LIMIT);
      } catch (err) {
        console.log('Load more error:', err);
      } finally {
        setLoadingMore(false);
      }
    };

 const fetchWithdrawalHistory = useCallback(async (resetPage = true) => {
  if (resetPage) {
    setWithdrawalHistoryLoading(true);
    setWithdrawalPage(1);
  }

  try {
    const currentPage = resetPage ? 1 : withdrawalPage;

    const res = await getWithdrawalHistory(currentPage, LIMIT);

    const { list, bal } = normaliseResponse(res);

    if (resetPage) {
      setWithdrawalHistory(list);
    } else {
      setWithdrawalHistory(prev => [...prev, ...list]);
    }

    if (bal !== undefined && bal !== null) {
      setBalance(bal);
    }

    setHasMoreWithdrawals(list.length === LIMIT);
  } catch (err) {
    console.log(err);
  } finally {
    setWithdrawalHistoryLoading(false);
    setLoadingMore(false);
  }
}, [withdrawalPage]);

    const loadMoreWithdrawals = async () => {
      if (loadingMore || !hasMoreWithdrawals) return;
      setLoadingMore(true);
      const nextPage = withdrawalPage + 1;
      setWithdrawalPage(nextPage);
      try {
        const res = await getWithdrawalHistory(nextPage, LIMIT);
        const { list } = normaliseResponse(res);
        setWithdrawalHistory(prev => [...prev, ...list]);
        setHasMoreWithdrawals(list.length === LIMIT);
      } catch (err) {
        console.log('Load more withdrawals error:', err);
      } finally {
        setLoadingMore(false);
      }
    };

    const onRefresh = async () => {
      setRefreshing(true);
      await Promise.all([fetchHistory(true), fetchWithdrawalHistory(true)]);
      setRefreshing(false);
    };

    const handleAddMoney = () => {
      setAmount('');
      setModalVisible(true);
    };

    const resetWithdrawForm = () => {
      setWithdrawAmount('');
      setWithdrawMethod('upi');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
      setUpiId('');
    };

    const handleWithdrawRequest = async () => {
      if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
        return;
      }

      setWithdrawSubmitting(true);
      try {
        const payload = { amount: Number(withdrawAmount) };

        if (withdrawMethod === 'upi') {
          if (!upiId.trim()) {
            Alert.alert('Missing UPI ID', 'Please enter your UPI ID.');
            return;
          }
          payload.upi_id = upiId.trim();
        } else {
          if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
            Alert.alert('Missing Bank Details', 'Please fill all bank account details.');
            return;
          }
          payload.bank_name = bankName.trim();
          payload.account_number = accountNumber.trim();
          payload.ifsc_code = ifscCode.trim().toUpperCase();
          payload.account_holder_name = accountHolderName.trim();
        }

        const res = await withdrawWallet(payload);
        if (res?.data?.status) {
          setWithdrawModalVisible(false);
          resetWithdrawForm();
          Alert.alert('Success', res.data.message || 'Withdrawal request submitted successfully.');
          fetchHistory(true);
          fetchWithdrawalHistory(true);
        } else {
          Alert.alert('Failed', res?.data?.message || 'Withdrawal request failed.');
        }
      } catch (err) {
        Alert.alert('Error', err?.response?.data?.message || 'Something went wrong. Please try again.');
      } finally {
        setWithdrawSubmitting(false);
      }
    };

    const openRazorpay = async () => {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }

      setModalVisible(false);

      const options = {
        description: 'Wallet Recharge',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: Math.round(amountNum * 100), // in paise
        name: 'SIGIRIDE',
        prefill: {
          email: user?.email || '',
          contact: user?.phone || user?.mobile || '',
          name: user?.name || user?.fullName || '',
        },
        theme: { color: '#FF1493' },
      };

      try {
        const data = await RazorpayCheckout.open(options);
        await confirmRecharge(amountNum, data.razorpay_payment_id);
      } catch (error) {
        if (error?.code !== 'PAYMENT_CANCELLED') {
          Alert.alert('Payment Failed', error?.description || 'Payment could not be completed');
        }
      }
    };

    const confirmRecharge = async (amountNum, transactionId) => {
      setLoading(true);
      try {
        const res = await rechargeWallet({
          amount: amountNum,
          payment_mode: 'ONLINE',
          transaction_id: transactionId,
        });
        const data = res.data;
        if (data?.balance !== undefined) setBalance(data.balance);
        Alert.alert('Success', `₹${amountNum.toFixed(2)} added to your wallet!`);
        fetchHistory();
      } catch (err) {
        console.log('Recharge error:', err);
        Alert.alert('Error', err?.response?.data?.message || 'Recharge failed. Please contact support.');
      } finally {
        setLoading(false);
        setAmount('');
      }
    };

    const formatAmount = (amt, type) =>
      `${type === 'credit' ? '+ ' : '- '}₹${parseFloat(amt).toFixed(2)}`;

    const getTransactionIcon = (type) =>
      type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle';

    const getTransactionColor = (type) =>
      type === 'credit' ? '#4CAF50' : '#FF5252';

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF1493']} />}
      >
        <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
        <CurvedHeader title="Wallet" />

        {/* Balance Card */}
        <LinearGradient
          colors={['#810a45', '#c0176b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹{parseFloat(balance).toFixed(2)}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddMoney} disabled={loading}>
              <Icon name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawButton} onPress={() => setWithdrawModalVisible(true)}>
              <Icon name="cash-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
           <Text style={{...styles.balanceLabel,marginTop:15,fontSize:12}}>​Keep at least ₹0 in your wallet to booking</Text>
        </LinearGradient>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF1493" />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        )}

        <View style={styles.historyTabContainer}>
          <TouchableOpacity
            style={[styles.historyTab, activeHistoryTab === 'recharge' && styles.historyTabActive]}
            onPress={() => setActiveHistoryTab('recharge')}
          >
            <Text style={[styles.historyTabText, activeHistoryTab === 'recharge' && styles.historyTabTextActive]}>Recharge History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historyTab, activeHistoryTab === 'withdrawal' && styles.historyTabActive]}
            onPress={() => setActiveHistoryTab('withdrawal')}
          >
            <Text style={[styles.historyTabText, activeHistoryTab === 'withdrawal' && styles.historyTabTextActive]}>Withdrawal History</Text>
          </TouchableOpacity>
        </View>

        {activeHistoryTab === 'recharge' ? (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recharge History</Text>
            {historyLoading ? (
              <ActivityIndicator size="small" color="#FF1493" style={{ marginVertical: 20 }} />
            ) : transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="time-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              <>
                {transactions.map((transaction, index) => (
                  <View key={transaction._id || transaction.id || index} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <Icon
                        name={getTransactionIcon(transaction.type || 'credit')}
                        size={40}
                        color={getTransactionColor(transaction.type || 'credit')}
                      />
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDesc}>
                          {transaction.description || 'Wallet Recharge'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.createdAt || transaction.date)}
                        </Text>
                        {transaction.transaction_id && (
                          <Text style={styles.transactionId}>TxnID: {transaction.transaction_id}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.type || 'credit') }]}>
                      {formatAmount(transaction.amount, transaction.type || 'credit')}
                    </Text>
                  </View>
                ))}
                {hasMore && (
                  <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={loadingMore}>
                    {loadingMore ? <ActivityIndicator size="small" color="#FF1493" /> : <Text style={styles.loadMoreText}>Load More</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
            {withdrawalHistoryLoading ? (
              <ActivityIndicator size="small" color="#FF1493" style={{ marginVertical: 20 }} />
            ) : withdrawalHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="time-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No withdrawal history yet</Text>
              </View>
            ) : (
              <>
                {withdrawalHistory.map((item, index) => (
                  <View key={item._id || item.id || index} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <Icon name="cash-outline" size={40} color="#FF9800" />
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDesc}>
                          {item.bank_name || item.upi_id ? `Withdrawal via ${item.bank_name ? 'Bank' : 'UPI'}` : 'Withdrawal Request'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(item.created_at || item.createdAt || item.date)}
                        </Text>
                        <Text style={styles.transactionId}>Status: {item.status || 'PENDING'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.transactionAmount, { color: item.status === 'PENDING' ? '#FF9800' : item.status === 'APPROVED' ? '#4CAF50' : '#F44336' }]}>
                      - ₹{parseFloat(item.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {hasMoreWithdrawals && (
                  <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreWithdrawals} disabled={loadingMore}>
                    {loadingMore ? <ActivityIndicator size="small" color="#FF1493" /> : <Text style={styles.loadMoreText}>Load More</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

       

      </ScrollView>
       {/* Withdraw Bottom Sheet */}
        {withdrawModalVisible && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetOverlayBg}
              activeOpacity={1}
              onPress={() => {
                if (!withdrawSubmitting) {
                  setWithdrawModalVisible(false);
                  resetWithdrawForm();
                }
              }}
            />

            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Withdraw Money</Text>
                <TouchableOpacity
                  onPress={() => {
                    setWithdrawModalVisible(false);
                    resetWithdrawForm();
                  }}
                  disabled={withdrawSubmitting}
                >
                  <Icon name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />

              <Text style={styles.modalLabel}>Payment Method</Text>
              <View style={styles.methodRow}>
                <TouchableOpacity
                  style={[styles.methodChip, withdrawMethod === 'upi' && styles.methodChipActive]}
                  onPress={() => setWithdrawMethod('upi')}
                  disabled={withdrawSubmitting}
                >
                  <Text style={[styles.methodChipText, withdrawMethod === 'upi' && styles.methodChipTextActive]}>UPI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodChip, withdrawMethod === 'bank' && styles.methodChipActive]}
                  onPress={() => setWithdrawMethod('bank')}
                  disabled={withdrawSubmitting}
                >
                  <Text style={[styles.methodChipText, withdrawMethod === 'bank' && styles.methodChipTextActive]}>Bank Account</Text>
                </TouchableOpacity>
              </View>

              {withdrawMethod === 'upi' ? (
                <>
                  <Text style={styles.modalLabel}>UPI Number</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="gourav@paytm"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    editable={!withdrawSubmitting}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="State Bank of India"
                    value={bankName}
                    onChangeText={setBankName}
                    editable={!withdrawSubmitting}
                  />
                  <Text style={styles.modalLabel}>Account Number</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="123456789012"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    editable={!withdrawSubmitting}
                  />
                  <Text style={styles.modalLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="SBIN0001234"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    autoCapitalize="characters"
                    editable={!withdrawSubmitting}
                  />
                  <Text style={styles.modalLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Gourav Dahalbar"
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    autoCapitalize="words"
                    editable={!withdrawSubmitting}
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.processButton}
                onPress={handleWithdrawRequest}
                disabled={withdrawSubmitting}
              >
                {withdrawSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.processButtonText}>Submit Withdrawal</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Add Money Bottom Sheet */}
        {modalVisible && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetOverlayBg}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />

            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Add Money</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Enter Amount (₹)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus={true}
              />

              <View style={styles.quickAmounts}>
                {[100, 500, 1000, 5000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text style={styles.quickAmountText}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.paymentModeRow}>
                <Icon name="card-outline" size={18} color="#FF1493" />
                <Text style={styles.paymentModeText}>Payment via Razorpay (Online)</Text>
              </View>

              <TouchableOpacity style={styles.processButton} onPress={openRazorpay}>
                <Text style={styles.processButtonText}>Proceed to Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    balanceCard: {
      backgroundColor: '#FF1493',
      margin: 20,
      padding: 15,
      borderRadius: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    balanceLabel: {
      color: '#fff',
      fontSize: 16,
      opacity: 0.9,
      marginBottom: 10,
    },
    balanceAmount: {
      color: '#fff',
      fontSize: 48,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    addButton: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 25,
      alignItems: 'center',
    },
    withdrawButton: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 25,
      alignItems: 'center',
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    loadingOverlay: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    loadingText: {
      marginTop: 8,
      color: '#FF1493',
      fontSize: 14,
    },
    historyTabContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    historyTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    historyTabActive: {
      backgroundColor: '#FF1493',
    },
    historyTabText: {
      color: '#666',
      fontSize: 13,
      fontWeight: '600',
    },
    historyTabTextActive: {
      color: '#fff',
    },
    transactionsSection: {
      backgroundColor: '#fff',
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 15,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionDetails: {
      marginLeft: 12,
      flex: 1,
    },
    transactionDesc: {
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 12,
      color: '#999',
    },
    transactionId: {
      fontSize: 11,
      color: '#bbb',
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: '#999',
      marginTop: 10,
    },
    sheetOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      zIndex: 999,
    },
    sheetOverlayBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    bottomSheet: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
      maxHeight: '92%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 20,
      bottom: 0,
    },
    sheetHandle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#DDD',
      alignSelf: 'center',
      marginBottom: 14,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    bottomSheetTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    modalLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    amountInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 12,
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 20,
    },
    quickAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 10,
    },
    quickAmountButton: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    quickAmountText: {
      fontSize: 14,
      color: '#FF1493',
      fontWeight: '600',
    },
    paymentModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff0f7',
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
    },
    paymentModeText: {
      fontSize: 13,
      color: '#FF1493',
      marginLeft: 8,
      fontWeight: '500',
    },
    methodRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    methodChip: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#fff',
    },
    methodChipActive: {
      backgroundColor: '#FF1493',
      borderColor: '#FF1493',
    },
    methodChipText: {
      color: '#666',
      fontSize: 13,
      fontWeight: '600',
    },
    methodChipTextActive: {
      color: '#fff',
    },
    loadMoreButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    loadMoreText: {
      fontSize: 14,
      color: '#FF1493',
      fontWeight: '600',
    },
    processButton: {
      backgroundColor: '#FF1493',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    processButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  export default WalletScreen;
