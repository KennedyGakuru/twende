
import {View, Text, TouchableOpacity, Image, ImageStyle} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  useRouter } from 'expo-router';
import { Button } from 'components/ui/Button';
import { useState } from 'react';

const SuccessScreen : React.FC = () => {
   
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const checkmarkStyle : ImageStyle = {
        height: 100,
        width: 100
    };

    const handleLogin = (): void => router.replace('/(auth)/login');

    return(
        <SafeAreaView className='flex-1 flex-10'
        >
            <View className="items-center mt-20">
            <Image source={require('../../assets/checked.png')}
                 style={checkmarkStyle}
                 />
                 </View>
            <Text className="text-primary font-bold text-4xl self-center mt-20">
            Password Changed!
            </Text>     
            <Text className="font-sans text-neutral-600 self-center">
            Your password has been changed successfully.
            </Text>     
            <Button onPress={handleLogin} loading={isLoading} fullWidth size="lg">
                                      Go back to Login
                                    </Button>   
        </SafeAreaView>
    )
};

export default SuccessScreen;