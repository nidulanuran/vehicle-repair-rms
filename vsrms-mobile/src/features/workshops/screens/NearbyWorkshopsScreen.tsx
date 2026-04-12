import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { WorkshopCard } from '../components/WorkshopCard';
import { useNearbyWorkshops } from '../queries/queries';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { VehicleSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkshopMapMarker } from '../components/WorkshopMapMarker';

// Fallback centre while location loads (central Sri Lanka)
const SRI_LANKA_CENTER = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 4.5,
  longitudeDelta: 3.0,
};

export function NearbyWorkshopsScreen() {
  const { theme } = useUnistyles();
  const mapRef = useRef<MapView>(null);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Request device location once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Showing all nearby workshops.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // Only fires once we have coordinates (enabled guard in the query)
  const { data, isLoading, isError, refetch } = useNearbyWorkshops(
    location
      ? { lat: location.coords.latitude, lng: location.coords.longitude, maxKm: 20 }
      : undefined
  );

  // Zoom the map to fit all workshop markers after they load
  useEffect(() => {
    if (!data || data.length === 0) return;
    const coords = data.map(w => ({
      latitude: w.location.coordinates[1],
      longitude: w.location.coordinates[0],
    }));
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 50, bottom: 60, left: 50 },
      animated: true,
    });
  }, [data]);

  // Show skeleton while device location is being determined
  if (!location && !locationError) return <VehicleSkeleton />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  const workshops = (data ?? []).filter(
    w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use user's position as initial centre; fall back to island-wide view
  const initialMapRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : SRI_LANKA_CENTER;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Full-screen map — always mounted so markers are visible in map mode */}
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialMapRegion}
          showsUserLocation={!!location}
          showsMyLocationButton={!!location}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {workshops.map((workshop, index) => (
            <WorkshopMapMarker
              key={workshop._id ?? workshop.id ?? index}
              workshop={workshop}
            />
          ))}
        </MapView>

        {/* Floating search + view-toggle header */}
        <View style={styles.floatingHeader}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={theme.colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search garages..."
              placeholderTextColor={theme.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === 'list' ? '#FFFFFF' : theme.colors.muted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons
                name="map"
                size={18}
                color={viewMode === 'map' ? '#FFFFFF' : theme.colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Permission-denied banner */}
        {locationError && (
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={13} color="#D97706" />
            <Text style={styles.locationBannerText} numberOfLines={1}>
              {locationError}
            </Text>
          </View>
        )}

        {/* Subtle "finding workshops" badge */}
        {isLoading && !locationError && (
          <View style={styles.loadingBadge}>
            <Text style={styles.loadingBadgeText}>Finding nearby workshops…</Text>
          </View>
        )}

        {/* List overlay (sits on top of the map when active) */}
        {viewMode === 'list' && (
          <View style={styles.listOverlay}>
            <FlashList
              data={workshops as any}
              renderItem={({ item }: any) => <WorkshopCard workshop={item} />}
              estimatedItemSize={220}
              onRefresh={refetch}
              refreshing={isLoading}
              keyExtractor={(item: any) => item._id || item.id || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <EmptyState
                    message={
                      isLoading
                        ? 'Finding workshops near you…'
                        : locationError
                        ? 'Enable location to find nearby garages.'
                        : 'No garages found in this area.'
                    }
                  />
                </View>
              }
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 4,
    height: 52,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  toggleBtn: {
    padding: 10,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.brand,
  },

  locationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 72 : 82,
    left: 16,
    right: 16,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  loadingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 72 : 82,
    alignSelf: 'center',
    zIndex: 99,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brand,
  },

  listOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    paddingTop: 84,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
  },
}));
