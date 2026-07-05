import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';

import { useAppTheme, LightColors } from './src/theme';
import { MainTabParamList, RootStackParamList } from './src/types';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import CostCalculatorScreen from './src/screens/CostCalculatorScreen';
import AddShipmentScreen from './src/screens/AddShipmentScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/* ── TAB ICONS ─────────────────────────────────────────── */
const TAB_ICONS: Record<keyof MainTabParamList, string> = {
    Shipments: '📦',
    Alerts: '🔔',
    Calculator: '🧮',
};

function TabIcon({ label }: { label: keyof MainTabParamList }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>{TAB_ICONS[label]}</Text>
        </View>
    );
}

/* ── BOTTOM TABS ────────────────────────────────────────── */
function MainTabs() {
    const { colors, isDark } = useAppTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 76,
                    paddingBottom: 14,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.navy,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'Nunito_700Bold',
                },
                tabBarIcon: () => <TabIcon label={route.name} />,
            })}
        >
            <Tab.Screen name="Shipments" component={DashboardScreen} />
            <Tab.Screen name="Alerts" component={AlertsScreen} />
            <Tab.Screen name="Calculator" component={CostCalculatorScreen} />
        </Tab.Navigator>
    );
}

/* ── ROOT STACK ─────────────────────────────────────────── */
export default function App() {
    const { colors, isDark } = useAppTheme();

    const [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_700Bold,
        Nunito_400Regular,
        Nunito_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.navy} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="AddShipment" component={AddShipmentScreen} options={{ presentation: 'modal' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}