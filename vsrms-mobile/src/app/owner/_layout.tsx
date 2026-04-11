import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, CalendarRange, Wrench, ClipboardPlus } from 'lucide-react-native';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

const ICONS = {
  index: LayoutDashboard,
  bookings: CalendarRange,
  jobs: Wrench,
  'create-record': ClipboardPlus,
};

const LABELS = {
  index: 'Stats',
  bookings: 'Bookings',
  jobs: 'Active',
  'create-record': 'Log',
};

export default function GarageLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={ICONS} labels={LABELS} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="create-record" />
    </Tabs>
  );
}
