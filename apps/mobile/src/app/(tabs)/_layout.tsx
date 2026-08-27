import { Redirect, Tabs } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';
import { TabIcon } from '@/components/TabIcon';
import { useTheme } from '@/theme/useTheme';

// Groupe authentifié. Si pas connecté → redirige vers le login.
export default function TabsLayout() {
  const { status } = useAuthContext();
  const theme = useTheme();

  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.borderInput,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color }) => <TabIcon name="dashboard" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Missions',
          tabBarIcon: ({ focused, color }) => <TabIcon name="offers" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused, color }) => <TabIcon name="messages" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon name="profile" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
