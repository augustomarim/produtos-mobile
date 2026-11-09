import { Tabs } from 'expo-router';

export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Produtos',
        }}
      />

      <Tabs.Screen
        name="conta"
        options={{
          title: 'Conta',
        }}
      />
    </Tabs>
  );
}