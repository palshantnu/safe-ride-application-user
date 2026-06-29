import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Animated,
    StatusBar,
    ToastAndroid,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SEND_OTP, VERIFY_OTP } from '../../redux/actions/action-creator';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otp2, setOtp2] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const dispatch = useDispatch();
    // const { isLoading } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false); 

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);
    
       

    const validatePhoneNumber = () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Required', 'Please enter your mobile number');
            return false;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
            return false;
        }
        return true;
    };

    const handleSendOTP = async () => {
        if (!validatePhoneNumber()) return;

        try {
            const res = await dispatch(SEND_OTP(parseInt(phoneNumber)));
            console.log('res', res);
            setOtp2(res.otp)
            ToastAndroid.show(res.message || 'OTP sent successfully', ToastAndroid.SHORT);
            setStep(2);
            if (res.success) {
                // setStep(2);
            } else {
                // Alert.alert('Error', res.message || 'Failed to send OTP');
            }
        } catch (err) {
            console.log('err', err);

            Alert.alert('Error', err.message);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('Invalid OTP', 'Enter valid OTP');
            return;
        }

        try {
            const res = await dispatch(VERIFY_OTP(parseInt(phoneNumber), otp));
            console.log('res', res);

            // if (res.success) {
            //     navigation.navigate('Main');
            // } else {
            //     Alert.alert('Error', res.message || 'Invalid OTP');
            // }
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 10) return cleaned;
        return cleaned.slice(0, 10);
    };

    return (
        <LinearGradient
            colors={['#FF1493', '#FFFFFF', '#FFFFFF']}
            start={{ x: 1.9, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../assets/logo.jpg')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Sign In</Text>
                            <Text style={styles.subtitle}>
                                {step === 1
                                    ? 'Enter your mobile number to continue'
                                    : 'Enter the verification code'}
                            </Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.card}>
                            {step === 1 ? (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.countryCode}>
                                            <Text style={styles.countryCodeText}>+91</Text>
                                            <Icon name="chevron-down" size={16} color="#FF1493" />
                                        </View>
                                        <View style={styles.dividerVertical} />
                                        <Icon
                                            name="smartphone"
                                            size={20}
                                            color="#FF1493"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Mobile Number"
                                            placeholderTextColor="#999"
                                            value={phoneNumber}
                                            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleSendOTP}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.buttonText}>Continue</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.rememberMeContainer}
                                        onPress={() => setRememberMe(!rememberMe)}
                                    >
                                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                            {rememberMe && <Icon name="check" size={12} color="#fff" />}
                                        </View>
                                        <Text style={styles.rememberMeText}>Remember Me</Text>
                                    </TouchableOpacity>

                                    {/* <View style={styles.signupContainer}>
                                        <Text style={styles.accountText}>Don't Have An Account? </Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Signup')}
                                        >
                                            <Text style={styles.signupLink}>Sign Up</Text>
                                        </TouchableOpacity>
                                    </View> */}
                                </>
                            ) : (
                                <>
                                    <Text style={styles.otpLabel}>Verification Code</Text>
                                    <Text style={styles.codeHint}>
                                        We've sent a 4-digit code to
                                    </Text>
                                    <Text style={{...styles.codeHint,fontSize:20}}>
                                      OTP is {otp2}
                                    </Text>
                                    <Text style={styles.phoneDisplay}>+91 {phoneNumber}</Text>

                                    <View style={styles.otpContainer}>
                                        <TextInput
                                            style={styles.otpInput}
                                            placeholder="0000"
                                            placeholderTextColor="#ccc"
                                            value={otp}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9]/g, '');
                                                setOtp(cleaned.slice(0, 4));
                                            }}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            autoFocus
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleVerifyOTP}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.buttonText}>Verify & Login</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setStep(1)}
                                        style={styles.changeButton}
                                    >
                                        <Icon name="arrow-left" size={16} color="#FF1493" />
                                        <Text style={[styles.changeText, { color: '#FF1493' }]}>Change Mobile Number</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleSendOTP}
                                        style={styles.resendButton}
                                    >
                                        <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* Footer */}
                        {step === 1 && (
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    By continuing, you agree to our
                                    <Text style={[styles.linkText, { color: '#FF1493' }]}> Terms of Service</Text> and
                                    <Text style={[styles.linkText, { color: '#FF1493' }]}> Privacy Policy</Text>
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FF1493',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0E7',
        borderRadius: 16,
        backgroundColor: '#FFF9FB',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        gap: 4,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2B4E',
    },
    dividerVertical: {
        width: 1,
        height: 24,
        backgroundColor: '#FFE0E7',
        marginRight: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1A2B4E',
    },
    button: {
        backgroundColor: '#FF1493',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#FF1493',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FF1493',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#FF1493',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#666',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    accountText: {
        fontSize: 14,
        color: '#666',
    },
    signupLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF1493',
    },
    otpLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A2B4E',
        marginBottom: 16,
        textAlign: 'center',
    },
    codeHint: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    phoneDisplay: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF1493',
        textAlign: 'center',
        marginBottom: 24,
    },
    otpContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    otpInput: {
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 4,
        borderWidth: 1.5,
        borderColor: '#FFE0E7',
        borderRadius: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF9FB',
        width: '100%',
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    changeText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    resendText: {
        color: '#FF1493',
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
    },
    linkText: {
        fontWeight: '500',
    },
});

export default LoginScreen;