import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, CalendarRange, ScrollText } from 'lucide-react-native';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

const ICONS = {
  index:            LayoutDashboard,
  'workshops/list': Building2,
  bookings:         CalendarRange,
  logs:             ScrollText,
};

const LABELS = {
  index:            'Overview',
  'workshops/list': 'Workshops',
  bookings:         'Operations',
  logs:             'Records',
};

export default function GarageLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={ICONS} labels={LABELS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workshops/list" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="logs" />
      
      {/* Hidden routes — not in tab bar */}
      <Tabs.Screen name="jobs"              options={{ href: null }} />
      <Tabs.Screen name="staff"             options={{ href: null }} />
      <Tabs.Screen name="create-record"     options={{ href: null }} />
      <Tabs.Screen name="workshops/[id]"    options={{ href: null }} />
      <Tabs.Screen name="settings"          options={{ href: null }} />
    </Tabs>
  );
}
