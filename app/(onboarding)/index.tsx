import { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { Button } from 'components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Real-Time Tracking',
    description: 'See where matatus are in real-time and never miss your ride again',
    image: require('../../assets/onboard1.png'),
  },
  {
    id: '2',
    title: 'Route Information',
    description: 'Get detailed information about routes, fares, and estimated travel times',
    image: require('../../assets/onboard2.png'),
  },
  {
    id: '3',
    title: 'Community Updates',
    description: 'Contribute to and benefit from real-time fare updates and traffic reports',
    image: require('../../assets/onboard3.png'),
  }
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (seen === 'true') {
        router.replace('/(auth)/sign-in');
      } else {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/sign-in');
  };

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      setActiveIndex(activeIndex + 1);
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
    }
  };

  

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View className="w-full items-center px-8 mt-10" style={{ width }}>
      <Text className="font-heading text-4xl text-center text-neutral-800 mb-3">{item.title}</Text>
      <Text className="font-sans text-xl text-center text-neutral-600 mb-2">{item.description}</Text>
      <Image
            source={item.image}
            style={{
                width: width * 0.85,
                height: height * 0.6,
              }}
            resizeMode='contain'
            />
    </View>
  );

  if (loading) return null;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Skip button */}
      <View className="absolute top-14 right-6 z-10">
        <TouchableOpacity onPress={handleFinish}>
          <Text className="font-sans-medium text-primary-500">Skip</Text>
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 justify-center pt-16">
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setActiveIndex(newIndex);
          }}
          keyExtractor={(item) => item.id}
        />
      </View>
      
      {/* Pagination indicators */}
      <View className="flex-row justify-center my-8">
        {onboardingData.map((_, index) => (
          <View
            key={index}
            className={`h-2 mx-1 rounded-full ${
              index === activeIndex ? 'w-6 bg-primary-500' : 'w-2 bg-neutral-300'
            }`}
          />
        ))}
      </View>
      
      {/* Navigation buttons */}
      <View className="flex-row justify-between items-center px-6 pb-12">
        {activeIndex > 0 ? (
          <Button
            variant="outline"
            onPress={handlePrevious}
            leadingIcon={<Ionicons name="arrow-back" size={20} color="#525252" />}
            
          >
            Back
          </Button>
        ) : (
          <View />
        )}
        
        <Button
          variant="primary"
          onPress={handleNext}
          trailingIcon={<Ionicons name="chevron-forward" size={20} color="white" />}
        >
          {activeIndex < onboardingData.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </View>
    </View>
  );
}