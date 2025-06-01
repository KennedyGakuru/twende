import {View, Text, TouchableOpacity, TextInput} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {  useRouter } from 'expo-router';

const ForgotPasswordScreen : React.FC = () => {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [emailError, setEmailError] =useState<string | null>(null);

    const handleBack = (): void => router.back();
    const handleLogin = (): void => router.replace('/(auth)/sign-in');
    const validateEmail = (email:string) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError(null);
        return true;
    };

    const handleSendCode = () => {
        const isEmailValid = validateEmail(email);

        if (isEmailValid){
          router.replace('/(auth)/verify');
        }
    };

    return(
        <SafeAreaView 
        className='flex-1 p-10 '
        >

            <View className="mt-20 items-center">
            <Text className="text-primary font-bold text-4xl">
            Forgot Password?
            </Text>
            <Text className="font-sans text-neutral-600">
            Don't worry! It occurs. Please enter the {'\n'}email address linked with your account.
            </Text>
            </View>
            <View className="mt-10 items-center ">
                            <TextInput
                             className='border border-gray-300 h-12 w-full rounded-lg px-4'
                             
                             placeholder='Enter your Email'
                             placeholderTextColor='#999'
                             value={email}
                             onChangeText={(text)  =>{
                                setEmail(text); 
                                validateEmail(text);}}
                             keyboardType='email-address'
                             autoCapitalize='none'
                             />
                             {emailError && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, alignSelf: 'flex-start' }}>{emailError}</Text>}
                        </View>
            <TouchableOpacity onPress={handleSendCode}
                className="w-full h-12 bg-gray-300 items-center justify-center rounded-lg mt-10">
                <Text className="text-[white]">Send Code</Text>
            </TouchableOpacity>
            <View className='items-center justify-end flex-1 pb-6'>
            <View className="flex-row ">
                <Text className="font-sans text-neutral-600">Remeber Password?</Text>
                <TouchableOpacity onPress={handleLogin}>
                    <Text className="text-primary ">Login</Text>
                </TouchableOpacity>
            </View>
            </View>            
        </SafeAreaView>
    )
}

export default ForgotPasswordScreen;