import { Tabs } from 'expo-router';
import { Key } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

function TabBarIcon({ color, size, name }: { color: string; size: number; name: keyof typeof Ionicons.glyphMap }) {
  return <Ionicons name={name} size={size} color={color} />;
}

type BottomTabBarProps = {
  state: {
    routes: Array<{ key: string; name: string }>;
    index: number;
  };
  descriptors: Record<string, {
    options: {
      tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      tabBarLabel?: string | ((props: { focused: boolean; color: string; position: 'below-icon'; children: string }) => React.ReactNode);
    };
  }>;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
};

export default function TabLayout() {
  const tabBarHeight = useSharedValue(60);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    height: tabBarHeight.value,
  }));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: 'white',
        },
        tabBarActiveTintColor: '#0066ff',
        tabBarInactiveTintColor: '#737373',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 4,
        },
      }}
      tabBar={(props: BottomTabBarProps) => (
        <Animated.View style={[{ backgroundColor: 'white' }, animatedTabBarStyle]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingTop: 4,
              paddingBottom: 12,
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#e5e5e5',
            }}
          >
            {props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const isFocused = props.state.index === index;
              const iconColor = isFocused ? '#0066ff' : '#737373';

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                >
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: iconColor,
                    size: 24,
                  })}
                  {options.tabBarLabel && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        fontFamily: 'Inter-Medium',
                        color: iconColor,
                      }}
                    >
                      {typeof options.tabBarLabel === 'function'
                        ? options.tabBarLabel({ 
                            focused: isFocused, 
                            color: iconColor, 
                            position: 'below-icon', 
                            children: '' 
                          })
                        : options.tabBarLabel}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number}) => (
            <TabBarIcon name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }: { color: string; size: number}) => (
            <TabBarIcon name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reporting"
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }: { color: string; size: number}) => (
            <TabBarIcon name="alert-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stages"
        options={{
          tabBarLabel: 'Stages',
          tabBarIcon: ({ color, size }: { color: string; size: number}) => (
            <TabBarIcon name="location-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number}) => (
            <TabBarIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}