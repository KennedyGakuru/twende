import {Text,TouchableOpacity,View, TextInput} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState,useRef } from 'react';
import {  useRouter } from 'expo-router';
import { Button } from 'components/ui/Button';

const VerifictionScreen : React.FC = () => {
    
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState(["","","",""]);
    const inputs = useRef<Array<TextInput | null>>([]);

    const handleBack = (): void => router.back();

    const handleChange = (text:string, index:number) => {
        if (/^\d$/.test(text)) {
            const newCode = [...code];
            newCode[index] = text;
            setCode(newCode);

            if (index < 3 &&  inputs.current[index +1]) {
                inputs.current[index + 1] ?.focus();
            }
        }else  if (text=== '') {
            const newCode = [...code];
            newCode[index] = '',
            setCode(newCode);
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && code[index] === '') {
            if(index > 0) {
                inputs.current[index -1]?.focus();
            }
        }
    };

    const handleVerify = (): void => router.replace('/(auth)/success');


    return(
        <SafeAreaView 
        className='flex-1 p-10'
        >
            

            <TouchableOpacity onPress={handleBack} 
                      style={{backgroundColor:'#F5F5F5', height:40, width:40, borderRadius:10, alignItems:'center', justifyContent:'center'}}>
                        <Ionicons name='arrow-back' size={25} color='black' 
                        />
                        </TouchableOpacity>
                        <View className="mt-20 ">
                        <Text className="text-primary font-bold text-4xl">
                        Verification
                        </Text>
                        <Text className="font-sans text-neutral-600  ">
                        Enter the verification code we just sent on your email address.
                        </Text>
                        </View>

                <View className="flex-row justify-between w-4/5 self-center mt-6">
                 {code.map((digit,index) =>(
                    <TextInput
                     key={index}
                     ref={(ref) => { inputs.current[index] = ref; }}
                     value={digit}
                     onChangeText={(text) => handleChange(text, index)}
                     onKeyPress={(e) => handleKeyPress(e, index)}
                     keyboardType='number-pad'
                     maxLength={1}
                     className="border border-gray-600  rounded-xl text-center text-xl p-3 w-12  h-12 dark:border-white"
                     />
                 ))}

                </View>
            <Button onPress={handleVerify} loading={isLoading} fullWidth size="lg">
                          Verify
                        </Button>

            <View className='items-center mt-10 flex-1'>
                        <View className="flex-row ">
                            <Text className="font-sans text-neutral-600">Didn't receive code?</Text>
                            <TouchableOpacity>
                                <Text className="text-primary ">Resend</Text>
                            </TouchableOpacity>
                        </View>
                        </View>           

        </SafeAreaView>
    )
};

export default VerifictionScreen;