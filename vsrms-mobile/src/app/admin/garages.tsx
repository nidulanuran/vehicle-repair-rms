import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, ScrollView,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native-unistyles';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useWorkshops } from '@/features/workshops/queries/queries';
import { useCreateWorkshop } from '@/features/workshops/queries/mutations';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Workshop } from '@/features/workshops/types/workshops.types';

// Colombo city centre as the default pin location
const DEFAULT_COORD = { lat: 6.9271, lng: 79.8612 };

// ─── Workshop card (list item) ──────────────────────────────────────────────

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.workshopIcon}>
          <Ionicons name="business" size={24} color="#F56E0F" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workshopName}>{workshop.name}</Text>
          <Text style={styles.workshopLocation}>{workshop.address}</Text>
        </View>
        <TouchableOpacity style={styles.manageBtn}>
          <Ionicons name="settings-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.statText}>{workshop.averageRating?.toFixed(1) || '0.0'}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
          <Text style={styles.statText}>{workshop.totalReviews || 0} reviews</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusText, { color: '#059669' }]}>Operational</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Location picker modal ──────────────────────────────────────────────────

interface LocationPickerProps {
  visible: boolean;
  initial: { lat: number; lng: number };
  onConfirm: (coord: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

function LocationPickerModal({ visible, initial, onConfirm, onCancel }: LocationPickerProps) {
  const [coord, setCoord] = useState(initial);
  const [locating, setLocating] = useState(false);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoord({ lat: latitude, lng: longitude });
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={pickerStyles.container}>
        {/* Header */}
        <View style={pickerStyles.header}>
          <TouchableOpacity onPress={onCancel} style={pickerStyles.headerBtn}>
            <Ionicons name="close" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={pickerStyles.headerTitle}>Pick Workshop Location</Text>
          <TouchableOpacity
            onPress={handleUseMyLocation}
            style={pickerStyles.headerBtn}
            disabled={locating}
          >
            {locating
              ? <ActivityIndicator size="small" color="#F56E0F" />
              : <Ionicons name="locate" size={22} color="#F56E0F" />
            }
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={pickerStyles.hint}>
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={pickerStyles.hintText}>Tap anywhere on the map to place the pin</Text>
        </View>

        {/* Map */}
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: initial.lat,
            longitude: initial.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          <Marker
            coordinate={{ latitude: coord.lat, longitude: coord.lng }}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setCoord({ lat: latitude, lng: longitude });
            }}
          />
        </MapView>

        {/* Bottom panel */}
        <View style={pickerStyles.bottomPanel}>
          <View style={pickerStyles.coordRow}>
            <Ionicons name="location" size={16} color="#F56E0F" />
            <Text style={pickerStyles.coordText}>
              {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
            </Text>
          </View>
          <TouchableOpacity
            style={pickerStyles.confirmBtn}
            onPress={() => onConfirm(coord)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={pickerStyles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AdminGaragesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [pickedCoord, setPickedCoord] = useState(DEFAULT_COORD);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    district: 'Colombo',
    description: '',
    servicesOffered: '',
  });

  const { data: workshops, isLoading, isError, refetch } = useWorkshops();
  const { mutate: create, isPending } = useCreateWorkshop();

  const handleCreate = () => {
    if (!formData.name || !formData.address || !formData.contactNumber) return;

    create(
      {
        name: formData.name,
        address: formData.address,
        contactNumber: formData.contactNumber,
        district: formData.district,
        description: formData.description || undefined,
        servicesOffered: formData.servicesOffered
          ? formData.servicesOffered.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        // GeoJSON: [longitude, latitude]
        location: { type: 'Point', coordinates: [pickedCoord.lng, pickedCoord.lat] },
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          setFormData({ name: '', address: '', contactNumber: '', district: 'Colombo', description: '', servicesOffered: '' });
          setPickedCoord(DEFAULT_COORD);
        },
      }
    );
  };

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── Dark top section ── */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Infrastructure</Text>
            <Text style={styles.headerTitle}>Garages</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── White card section ── */}
      <View style={[styles.mainCard, { overflow: 'hidden' }]}>
        {isLoading && !workshops ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F56E0F" />
          </View>
        ) : isError ? (
          <ErrorScreen onRetry={refetch} variant="inline" />
        ) : (
          <FlashList<Workshop>
            data={workshops || []}
            keyExtractor={item => item._id || item.id || ''}
            renderItem={({ item }) => <WorkshopCard workshop={item} />}
            estimatedItemSize={140}
            onRefresh={refetch}
            refreshing={isLoading}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState message="No workshops found. Create your first one!" />
            }
          />
        )}
      </View>

      {/* ── Register workshop modal ── */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Workshop</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workshop Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Master Motors"
                  value={formData.name}
                  onChangeText={t => setFormData(f => ({ ...f, name: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street, City"
                  value={formData.address}
                  onChangeText={t => setFormData(f => ({ ...f, address: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+94 XX XXX XXXX"
                  keyboardType="phone-pad"
                  value={formData.contactNumber}
                  onChangeText={t => setFormData(f => ({ ...f, contactNumber: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Colombo"
                  value={formData.district}
                  onChangeText={t => setFormData(f => ({ ...f, district: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Brief description of the workshop…"
                  multiline
                  textAlignVertical="top"
                  value={formData.description}
                  onChangeText={t => setFormData(f => ({ ...f, description: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Services Offered (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Oil Change, Brake Service, AC Repair"
                  value={formData.servicesOffered}
                  onChangeText={t => setFormData(f => ({ ...f, servicesOffered: t }))}
                />
              </View>

              {/* ── Map location picker ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity
                  style={styles.locationPickerBtn}
                  onPress={() => setLocationPickerVisible(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.locationPickerIcon}>
                    <Ionicons name="map" size={18} color="#F56E0F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationPickerLabel}>Workshop Pin</Text>
                    <Text style={styles.locationPickerCoord}>
                      {pickedCoord.lat.toFixed(5)}, {pickedCoord.lng.toFixed(5)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, isPending && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={isPending}
            >
              {isPending
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.saveBtnText}>Save Workshop</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Map location picker modal ── */}
      <LocationPickerModal
        visible={locationPickerVisible}
        initial={pickedCoord}
        onConfirm={(coord) => {
          setPickedCoord(coord);
          setLocationPickerVisible(false);
        }}
        onCancel={() => setLocationPickerVisible(false)}
      />
    </ScreenWrapper>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pickerStyles = StyleSheet.create(() => ({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  hintText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  bottomPanel: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  coordText: { fontSize: 13, fontWeight: '700', color: '#9A3412', fontVariant: ['tabular-nums'] as any },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F56E0F',
    borderRadius: 16,
    height: 54,
    shadowColor: '#F56E0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
}));

const styles = StyleSheet.create((theme) => ({
  topSection: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: theme.spacing.headerBottom,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  headerSub: {
    fontSize: theme.fonts.sizes.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.pageTitle,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F56E0F',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F56E0F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
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
    elevation: 16,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 130,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  workshopIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  workshopName: { fontSize: 16, fontWeight: '900', color: '#1A1A2E' },
  workshopLocation: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 1 },
  manageBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  modalBg: { flex: 1, backgroundColor: 'rgba(26,26,46,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 15, color: '#1A1A2E', borderWidth: 1, borderColor: '#E5E7EB' },

  locationPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPickerLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  locationPickerCoord: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },

  saveBtn: {
    backgroundColor: '#F56E0F', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
    shadowColor: '#F56E0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
}));
