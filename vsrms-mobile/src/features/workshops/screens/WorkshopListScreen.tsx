import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native-unistyles';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useWorkshops } from '../queries/queries';
import { WorkshopCard } from '../components/WorkshopCard';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Workshop } from '../types/workshops.types';

export function WorkshopListScreen() {
  const { data, isLoading, isError, refetch } = useWorkshops();

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── DARK TOP SECTION ── */}
      <View style={styles.topSection}>
        <View style={styles.headerTextRow}>
          <View>
            <Text style={styles.headerSub}>Find Help</Text>
            <Text style={styles.headerTitle}>Nearby Garages</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── WHITE CARD SECTION ── */}
      <View style={[styles.mainCard, { overflow: 'hidden' }]}>
        {isLoading && !data ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F56E0F" />
            <Text style={styles.loadingText}>Searching nearby...</Text>
          </View>
        ) : isError ? (
          <ErrorScreen onRetry={refetch} variant="inline" />
        ) : (
          <FlashList
             data={(data || []) as Workshop[]}
             renderItem={({ item }) => <WorkshopCard workshop={item as Workshop} />}
             estimatedItemSize={280}
             onRefresh={refetch}
             refreshing={isLoading}
             keyExtractor={(item: Workshop) => item._id || item.id || Math.random().toString()}
             contentContainerStyle={styles.list}
             ListEmptyComponent={<EmptyState message="No repair centers found in your area." />}
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
  headerTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
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
  
  filterBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },

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
