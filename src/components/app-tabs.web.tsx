import { Tabs } from 'expo-router';

export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
        }}
      />
    </Tabs>
  );
}