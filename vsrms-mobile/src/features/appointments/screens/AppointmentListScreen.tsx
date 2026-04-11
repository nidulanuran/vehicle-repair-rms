import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useMyAppointments } from '../queries/queries';
import { AppointmentCard } from '../components/AppointmentCard';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Appointment } from '../types/appointments.types';

export function AppointmentListScreen() {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('pending');
  const { data, isLoading, isError, refetch } = useMyAppointments(status);

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── DARK TOP SECTION ── */}
      <View style={styles.topSection}>
        <View style={styles.headerTextRow}>
          <View>
            <Text style={styles.headerSub}>Tracking</Text>
            <Text style={styles.headerTitle}>My Schedule</Text>
          </View>
        </View>

        {/* Custom Segmented Control */}
        <View style={styles.tabContainer}>
          {(['pending', 'confirmed', 'completed'] as const).map((s) => (
            <TouchableOpacity 
              key={s} 
              onPress={() => setStatus(s)}
              style={[styles.tab, status === s && styles.activeTab]}
            >
              <Text style={[styles.tabText, status === s && styles.activeTabText]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
              {status === s && <View style={styles.activeLine} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── WHITE CARD SECTION ── */}
      <View style={[styles.mainCard, { overflow: 'hidden' }]}>
        {isLoading && !data ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F56E0F" />
            <Text style={styles.loadingText}>Loading your plans...</Text>
          </View>
        ) : isError ? (
          <ErrorScreen onRetry={refetch} variant="inline" />
        ) : (
          <FlashList
            data={(data || []) as Appointment[]}
            renderItem={({ item }) => <AppointmentCard appointment={item as Appointment} />}
            estimatedItemSize={160}
            onRefresh={refetch}
            refreshing={isLoading}
            keyExtractor={(a: Appointment) => a._id || a.id || Math.random().toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState message={`No ${status} appointments found.`} />}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  topSection: { 
    paddingHorizontal: theme.spacing.screenPadding, 
    paddingTop: 16, 
    paddingBottom: theme.spacing.headerBottom, 
    position: 'relative', 
    overflow: 'hidden' 
  },
  headerTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, marginBottom: 20 },
  headerSub: { 
    fontSize: theme.fonts.sizes.caption, 
    color: 'rgba(255,255,255,0.7)', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  headerTitle: { 
    fontSize: theme.fonts.sizes.pageTitle, 
    color: '#FFFFFF', 
    fontWeight: '900', 
    letterSpacing: -0.5, 
    marginTop: 4 
  },

  tabContainer: { flexDirection: 'row', gap: 20, zIndex: 10 },
  tab: { paddingVertical: 8, position: 'relative' },
  activeTab: {},
  tabText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  activeTabText: { color: '#FFFFFF' },
  activeLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#F56E0F', borderRadius: 2 },

  decCircle1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(245,110,15,0.13)', top: -25, right: -25 },
  decCircle2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(245,110,15,0.08)', bottom: 10, right: 90 },

  mainCard: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    marginTop: theme.spacing.cardOverlap, 
    flex: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 16 
  },
  
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  
  list: { 
    paddingHorizontal: theme.spacing.screenPadding, 
    paddingTop: 24, 
    paddingBottom: 130 
  },
}));
