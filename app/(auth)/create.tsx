import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {View, TouchableOpacity, Text} from 'react-native'
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  useRouter } from 'expo-router';


const NewPasswordScreen : React.FC = () => {
    const router = useRouter();
    const [password, setPassword] = useState<string>('');
    const [confirmpassword, setConfirmPassword] = useState<string>('');
    const [passwordError,setPasswordError] = useState<string | null>(null);
    const [secureTextEntry,setSecureTextEntry] =useState<boolean>(true);

    const handleBack = (): void => router.back();
    const toggleSecurity = (): void => setSecureTextEntry(!secureTextEntry);

    const validatePassword =(confirmText: string) => {
        if (password !== confirmText) {
            setPasswordError("Password don't match");
            return false;
        }
        setPasswordError(null)
        return true;
    };
    return (
        <SafeAreaView 
        >
            <TouchableOpacity onPress={handleBack} 
            style={{backgroundColor:'#F5F5F5', height:40, width:40, borderRadius:10, alignItems:'center', justifyContent:'center'}}>
            <Ionicons name='arrow-back' size={25} color='black' 
            />
            </TouchableOpacity>
            <View className="mt-20 ">
            <Text className="text-primary font-bold text-4xl">
            Create Password?
            </Text>
            <Text className="text-gray-600 text-xl ">
            Your new password must be unique from those {'\n'}previously used.
            </Text>
            </View>

            <View className="mt-10 items-center">
                            <View className=" border border-gray-300 h-12 w-full flex-row items-center rounded-lg">
                            <TextInput
                             className="flex-1 px-4"
                             
                             placeholder='Enter your Password'
                             placeholderTextColor='#999'
                             value={password}
                             onChangeText={(text: string) => setPassword(text)}
                             secureTextEntry={secureTextEntry}
                             />
                             <TouchableOpacity onPress={toggleSecurity}
                             className="p-2" >
                              <Ionicons name={secureTextEntry ? 'eye-off' : 'eye'}
                              size={20}
                              color='#29B6F6'
                              />
                              </TouchableOpacity>
                              </View>
                        </View>
                        <View className="mt-10 items-center">
                            <View className=" border border-gray-300 h-12 w-full flex-row items-center rounded-lg">
                            <TextInput
                             className="flex-1 px-4"
                             
                             placeholder='Confirm your Password'
                             placeholderTextColor='#999'
                             value={confirmpassword}
                             onChangeText={(text) =>{
                                setConfirmPassword(text);
                                validatePassword(text);}}
                             secureTextEntry={secureTextEntry}
                             />
                             <TouchableOpacity onPress={toggleSecurity}
                             className="p-2" >
                              <Ionicons name={secureTextEntry ? 'eye-off' : 'eye'}
                              size={20}
                              color='#29B6F6'
                              />
                              </TouchableOpacity>
                              </View>
                              {passwordError && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, alignSelf:'flex-start' }}>{passwordError}</Text>}
                        </View>
            <TouchableOpacity 
            className="w-full h-12 bg-primary items-center justify-center rounded-lg mt-10">
                <Text className="text-[white]">Register</Text>
            </TouchableOpacity>          
        </SafeAreaView>
    )
};


export default NewPasswordScreen;