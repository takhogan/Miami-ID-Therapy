import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from './screens/ActivitiesScreen';
import HomeScreen from './screens/HomeScreen';
import CityHallScreen from './screens/CityHallScreen';
import CommunityCenterScreen from './screens/CommunityCenterScreen';
import GardenScreen from './screens/GardenScreen';

const Stack = createNativeStackNavigator();

const lightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1d1d1f',
    background: '#f5f5f7',
    card: '#ffffff',
    text: '#1d1d1f',
    border: '#e5e5ea',
    notification: '#1d1d1f',
  },
  fonts: DefaultTheme.fonts,
};

export default function App() {
  return (
    <NavigationContainer theme={lightTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1d1d1f',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#f5f5f7' },
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        }}
      >
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={{ title: 'Activities' }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="CityHall" component={CityHallScreen} options={{ title: 'City Hall' }} />
        <Stack.Screen name="CommunityCenter" component={CommunityCenterScreen} options={{ title: 'Community Center' }} />
        <Stack.Screen name="Garden" component={GardenScreen} options={{ title: 'Garden' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
