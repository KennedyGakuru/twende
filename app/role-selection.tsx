import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '../context/role-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const roles = [
  {
    id: 'commuter',
    title: 'Commuter',
    description: 'Track matatus in real-time and find the best routes',
    icon: <Ionicons name='person' size={32} color="#0066ff" />,
    image: 'https://images.pexels.com/photos/3849167/pexels-photo-3849167.jpeg'
  },
  {
    id: 'driver',
    title: 'Driver',
    description: 'Manage your route and connect with passengers',
    icon: <Ionicons name='bus' size={32} color="#00cc99" />,
    image: 'https://images.pexels.com/photos/13861/IMG_3496bw.jpg'
  },
  {
    id: 'sacco',
    title: 'SACCO Admin',
    description: 'Manage your fleet and monitor operations',
    icon: <Ionicons name='build-outline' size={32} color="#f59e0b" />,
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'
  }
];

export default function RoleSelectionScreen() {
    const {setRole} = useRole();


  const handleRoleSelect = async (roleId: string) => {
    try {
    await AsyncStorage.setItem('userRole', roleId);
    setRole(roleId as any);

    switch (roleId) {
      case 'commuter':
        router.replace('/(tabs)');
        break;
      case 'driver':
         router.replace('/(driver)');
        break;
      case 'sacco':
         router.replace('/(sacco)');
        break;
    }
    } catch (e) {
    console.error('Failed to save role', e);
  }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={{flexGrow:1, padding:6}}>
        <View className="items-center my-8">
          <Text className="font-heading text-2xl text-neutral-800">Choose Your Role</Text>
          <Text className="font-sans text-neutral-500 text-center mt-2">
            Select how you'll use Matatu Tracker
          </Text>
        </View>
        
        <View className="space-y-4">
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden"
              onPress={() => handleRoleSelect(role.id)}
            >
              <Image
                source={{ uri: role.image }}
                className="w-full h-40"
                contentFit="cover"
              />
              
              <View className="p-4">
                <View className="flex-row items-center mb-2">
                  <View className={`w-12 h-12 rounded-full items-center justify-center ${
                    role.id === 'commuter' ? 'bg-primary-100' :
                    role.id === 'driver' ? 'bg-success-100' : 'bg-warning-100'
                  }`}>
                    {role.icon}
                  </View>
                  <Text className="font-heading text-xl text-neutral-800 ml-3">
                    {role.title}
                  </Text>
                </View>
                
                <Text className="font-sans text-neutral-600">
                  {role.description}
                </Text>
                
                <Button
                  variant="outline"
                  className="mt-3"
                  onPress={() => handleRoleSelect(role.id)}
                >
                  Continue as {role.title}
                </Button>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}