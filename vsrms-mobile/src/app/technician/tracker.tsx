import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native-unistyles';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ErrorScreen } from '@/components/feedback/ErrorScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks';
import { useWorkshopAppointments } from '@/features/appointments/queries/queries';
import { useUpdateAppointmentStatus } from '@/features/appointments/queries/mutations';
import { Appointment } from '@/features/appointments/types/appointments.types';

function getVehicleLabel(a: Appointment): string {
  if (typeof a.vehicleId === 'object') return `${a.vehicleId.make} ${a.vehicleId.model}`;
  return 'Vehicle';
}
function getVehicleReg(a: Appointment): string {
  if (typeof a.vehicleId === 'object') return a.vehicleId.registrationNo;
  return '';
}
function getCustomerLabel(a: Appointment): string {
  if (typeof a.userId === 'object') return a.userId.fullName ?? a.userId.email;
  return 'Customer';
}

function TrackerCard({ item, onComplete }: { item: Appointment; onComplete: (id: string) => void }) {
  const id = item._id ?? item.id ?? '';
  const dateStr = new Date(item.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleIconBox}>
          <Ionicons name="hammer-outline" size={20} color="#F56E0F" />
        </View>
        <View style={styles.vehicleBlock}>
          <Text style={styles.vehicleName}>{getVehicleLabel(item)}</Text>
          <Text style={styles.vehicleReg}>{getVehicleReg(item)}</Text>
        </View>
        <View style={styles.inProgressBadge}>
          <View style={styles.inProgressDot} />
          <Text style={styles.inProgressText}>Working</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{getCustomerLabel(item)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="construct-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{item.serviceType}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{dateStr}</Text>
        </View>
      </View>

      {item.notes ? (
        <View style={styles.notesBox}>
          <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
          <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(id)} activeOpacity={0.85}>
        <Ionicons name="checkmark-done" size={18} color="#fff" />
        <Text style={styles.completeBtnText}>Finalize Job</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StaffTrackerScreen() {
  const { user } = useAuth();
  const workshopId = user?.workshopId;

  const { data, isLoading, isError, refetch } = useWorkshopAppointments(workshopId, 'in_progress');
  const { mutate: updateStatus, isPending } = useUpdateAppointmentStatus();

  const handleComplete = (id: string) => {
    Alert.alert('Complete Job', 'Confirm that this repair is finished?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Finish Job', onPress: () => updateStatus({ id, status: 'completed' }) },
    ]);
  };

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── DARK TOP SECTION ── */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Real-time Tracker</Text>
            <Text style={styles.headerTitle}>Job Tracker</Text>
          </View>
          <View style={styles.countBadge}>
            {isPending
              ? <ActivityIndicator size="small" color="#F56E0F" />
              : <View style={{ alignItems: 'center' }}>
                  <Text style={styles.countNumber}>{data?.length ?? 0}</Text>
                  <Text style={styles.countLabel}>Active</Text>
                </View>
            }
          </View>
        </View>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── WHITE CARD SECTION ── */}
      <View style={[styles.mainCard, { overflow: 'hidden' }]}>
        {isLoading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F56E0F" />
          </View>
        ) : isError ? (
          <ErrorScreen onRetry={refetch} variant="inline" />
        ) : (
          <FlashList
            data={(data ?? []) as Appointment[]}
            keyExtractor={(a: Appointment) => a._id || a.id || Math.random().toString()}
            renderItem={({ item }) => <TrackerCard item={item as Appointment} onComplete={handleComplete} />}
            estimatedItemSize={240}
            onRefresh={refetch}
            refreshing={isLoading}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState message="You're all caught up! No active jobs." />}
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 10 },
  headerSub: { 
    fontSize: theme.fonts.sizes.caption, 
    color: 'rgba(255,255,255,0.7)', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  headerTitle: { 
    fontSize: theme.fonts.sizes.pageTitle, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.5, 
    marginTop: 4 
  },
  countBadge: { backgroundColor: 'rgba(245,110,15,0.2)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F56E0F' },
  countNumber: { fontSize: 22, fontWeight: '900', color: '#F56E0F', lineHeight: 26 },
  countLabel: { fontSize: 10, fontWeight: '800', color: '#F56E0F', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  decCircle1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(245,110,15,0.12)', top: -25, right: -25 },
  decCircle2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(245,110,15,0.07)', bottom: 10, right: 90 },

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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { 
    paddingHorizontal: theme.spacing.screenPadding, 
    paddingTop: 24, 
    paddingBottom: 130 
  },

  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  vehicleIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FDE68A' },
  vehicleBlock: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.3 },
  vehicleReg: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  inProgressBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  inProgressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  inProgressText: { fontSize: 10, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 },

  divider: { height: 1.5, backgroundColor: '#F3F4F6', marginBottom: 14 },

  metaGrid: { gap: 8, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  notesBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  notesText: { flex: 1, fontSize: 12, color: '#6B7280', fontWeight: '600', fontStyle: 'italic', lineHeight: 18 },

  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16, backgroundColor: '#059669', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  completeBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
}));
