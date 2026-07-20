import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';

import { useAppTheme, LightColors, ThemeProvider } from './src/theme';
import { MainTabParamList, RootStackParamList } from './src/types';
import { PackageIcon, BellIcon, CalculatorIcon, GearIcon, SearchIcon, UserIcon } from './src/components/Icons';
import { loadAuthState } from './src/services/storage';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import CostCalculatorScreen from './src/screens/CostCalculatorScreen';
import AddShipmentScreen from './src/screens/AddShipmentScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SearchProductsScreen from './src/screens/SearchProductsScreen';
import MyProductsScreen from './src/screens/MyProductsScreen';
import SupplierProfileScreen from './src/screens/SupplierProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/* ── TAB ICONS ─────────────────────────────────────────── */
const TAB_ICONS: Record<keyof MainTabParamList, React.FC<{ size: number; color: string }>> = {
    Shipments: ({ size, color }) => <PackageIcon size={size} color={color} />,
    SearchProducts: ({ size, color }) => <SearchIcon size={size} color={color} />,
    MyProducts: ({ size, color }) => <PackageIcon size={size} color={color} />,
    SupplierProfile: ({ size, color }) => <UserIcon size={size} color={color} />,
    Alerts: ({ size, color }) => <BellIcon size={size} color={color} />,
    Calculator: ({ size, color }) => <CalculatorIcon size={size} color={color} />,
    Settings: ({ size, color }) => <GearIcon size={size} color={color} />,
};

function getUserRole(): string {
    return (globalThis as any).__IMPORT_EASE_ROLE__ || 'IMPORTER';
}

/* ── BOTTOM TABS ────────────────────────────────────────── */
function MainTabs() {
    const { colors } = useAppTheme();
    const [role, setRole] = useState(getUserRole());

    useEffect(() => {
        const interval = setInterval(() => {
            const current = getUserRole();
            if (current !== role) setRole(current);
        }, 500);
        return () => clearInterval(interval);
    }, [role]);

    const isSupplier = role === 'SUPPLIER';

    const commonTabBarOptions = {
        headerShown: false,
        tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            height: 76,
            paddingBottom: 14,
            paddingTop: 8,
            elevation: 12,
            shadowColor: colors.navy,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.cobalt,
        tabBarInactiveTintColor: colors.caption,
        tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'Nunito_700Bold' as const,
            marginTop: 2,
        },
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                ...commonTabBarOptions,
                tabBarIcon: ({ size, color }) => {
                    const Icon = TAB_ICONS[route.name];
                    return <Icon size={size} color={color} />;
                },
            })}
        >
            {isSupplier ? (
                <>
                    <Tab.Screen name="MyProducts" component={MyProductsScreen} />
                    <Tab.Screen name="SupplierProfile" component={SupplierProfileScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Shipments" component={DashboardScreen} />
                    <Tab.Screen name="SearchProducts" component={SearchProductsScreen} />
                    <Tab.Screen name="Alerts" component={AlertsScreen} />
                    <Tab.Screen name="Calculator" component={CostCalculatorScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </>
            )}
        </Tab.Navigator>
    );
}

/* ── ROOT STACK ─────────────────────────────────────────── */
export default function App() {
    const { colors, isDark } = useAppTheme();
    const [authReady, setAuthReady] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_700Bold,
        Nunito_400Regular,
        Nunito_700Bold,
    });

    useEffect(() => {
        loadAuthState().finally(() => setAuthReady(true));
    }, []);

    if (!fontsLoaded || !authReady) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.navy} />
            </View>
        );
    }

    return (
        <ThemeProvider>
        <NavigationContainer>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="AddShipment" component={AddShipmentScreen} options={{ presentation: 'modal' }} />
            </Stack.Navigator>
        </NavigationContainer>
        </ThemeProvider>
    );
}
