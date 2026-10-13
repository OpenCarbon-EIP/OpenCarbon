import { Redirect, Tabs } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';
import { TabIcon } from '@/components/TabIcon';
import { SessionStatus } from '@/features/auth/SessionStatus';
import { useTheme } from '@/theme/useTheme';

// Groupe authentifié. Session non confirmée → SessionStatus (on garde l'onglet demandé
// par un lien direct) ; pas connecté → redirige vers le login.
export default function TabsLayout() {
  const { status } = useAuthContext();
  const theme = useTheme();

  if (status === 'guest') return <Redirect href="/(auth)/login" />;
  if (status !== 'authenticated') return <SessionStatus />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
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
