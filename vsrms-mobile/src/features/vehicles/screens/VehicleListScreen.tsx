import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useVehicles } from '../queries/queries';
import { VehicleCard } from '../components/VehicleCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { Vehicle } from '../types/vehicles.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function VehicleListScreen() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const router = useRouter();

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── DARK TOP SECTION ── */}
      <View style={styles.topSection}>
        <View style={styles.headerTextRow}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
             <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => router.push('/customer/vehicles/add')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── WHITE CARD SECTION ── */}
      <View style={[styles.mainCard, { overflow: 'hidden' }]}>
        {isLoading && !vehicles ? (
           <View style={styles.loaderContainer}>
             <ActivityIndicator size="large" color="#F56E0F" />
             <Text style={styles.loadingText}>Loading garage...</Text>
           </View>
        ) : isError ? (
          <ErrorScreen onRetry={refetch} variant="inline" />
        ) : (
          <FlashList<Vehicle>                               
            data={vehicles || []}
            renderItem={({ item }) => <VehicleCard vehicle={item} />}
            // @ts-expect-error - FlashList requires estimatedItemSize dynamically
            estimatedItemSize={120}                 
            keyExtractor={(v) => v._id || v.id!}
            onRefresh={refetch}
            refreshing={isLoading}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState message="You haven't added any vehicles yet." />}
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
  headerTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, marginTop: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { 
    fontSize: theme.fonts.sizes.pageTitle, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.5 
  },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F56E0F', alignItems: 'center', justifyContent: 'center', shadowColor: '#F56E0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  
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
