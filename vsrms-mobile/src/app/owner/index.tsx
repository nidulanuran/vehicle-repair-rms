import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAuth } from '@/hooks';
import { useWorkshop } from '@/features/workshops/queries/queries';
import { useWorkshopAppointments } from '@/features/appointments/queries/queries';
import { Appointment } from '@/features/appointments/types/appointments.types';

function getCustomerLabel(a: Appointment): string {
  if (typeof a.userId === 'object') return a.userId.fullName ?? a.userId.email;
  return 'Customer';
}

function getVehicleLabel(a: Appointment): string {
  if (typeof a.vehicleId === 'object') {
    return `${a.vehicleId.make} ${a.vehicleId.model} (${a.vehicleId.registrationNo})`;
  }
  return 'Vehicle';
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const workshopId = user?.workshopId;
  const displayName = user?.fullName ?? user?.email ?? 'Owner';
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const { data: workshop, isLoading: wLoading } = useWorkshop(workshopId ?? '');
  const { data: pending,    isLoading: pLoading } = useWorkshopAppointments(workshopId, 'pending');
  const { data: inProgress, isLoading: iLoading } = useWorkshopAppointments(workshopId, 'in_progress');
  const { data: confirmed,  isLoading: cLoading } = useWorkshopAppointments(workshopId, 'confirmed');

  const anyLoading = pLoading || iLoading || cLoading;
  const recentActivity = [...(pending ?? []), ...(confirmed ?? [])].slice(0, 5);

  return (
    <ScreenWrapper bg="#1A1A2E">
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── DARK TOP SECTION ── */}
      <View style={styles.topSection}>
        <View style={styles.headerTextRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerSub}>Control Center</Text>
            {wLoading ? (
               <ActivityIndicator size="small" color="#F56E0F" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                 <Text style={styles.headerTitle} numberOfLines={1}>{workshop?.name ?? 'My Garage'}</Text>
                 <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{(workshop?.averageRating ?? 0).toFixed(1)}</Text>
                 </View>
               </View>
            )}
          </View>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => signOut()}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.logoutIcon}>
               <Ionicons name="log-out" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />
      </View>

      {/* ── WHITE CARD SECTION ── */}
      <View style={styles.mainCard}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={true}>
          
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time-outline" size={22} color="#D97706" />
              </View>
              {pLoading ? <ActivityIndicator size="small" color="#F59E0B" /> : <Text style={styles.statValue}>{pending?.length ?? 0}</Text>}
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245,110,15,0.1)' }]}>
                <Ionicons name="hammer-outline" size={22} color="#F56E0F" />
              </View>
              {iLoading ? <ActivityIndicator size="small" color="#F56E0F" /> : <Text style={styles.statValue}>{inProgress?.length ?? 0}</Text>}
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />
              </View>
              {cLoading ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={styles.statValue}>{confirmed?.length ?? 0}</Text>}
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Garage Actions</Text>
            <View style={styles.quickLinks}>
              {[
                { icon: 'document-text-outline' as const, label: 'Add Record', href: '/owner/create-record', color: '#3B82F6', bg: '#EFF6FF' },
                { icon: 'calendar-outline' as const,      label: 'Bookings',   href: '/owner/bookings',      color: '#10B981', bg: '#F0FDF4' },
                { icon: 'construct-outline' as const,     label: 'Daily Jobs', href: '/owner/jobs',          color: '#F56E0F', bg: '#FFF7ED' },
              ].map(q => (
                <TouchableOpacity key={q.label} style={styles.quickLink} onPress={() => router.push(q.href as any)} activeOpacity={0.7}>
                  <View style={[styles.quickLinkIconBox, { backgroundColor: q.bg, borderColor: `${q.color}20` }]}>
                    <Ionicons name={q.icon} size={24} color={q.color} />
                  </View>
                  <Text style={styles.quickLinkText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
              <TouchableOpacity onPress={() => router.push('/owner/bookings' as any)}>
                <Text style={styles.linkText}>View Schedule</Text>
              </TouchableOpacity>
            </View>

            {anyLoading ? (
              <ActivityIndicator color="#F56E0F" style={{ marginTop: 12 }} />
            ) : recentActivity.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            ) : (
              recentActivity.map((a) => (
                <View key={a._id} style={styles.apptCard}>
                  <View style={[styles.apptDot, { backgroundColor: a.status === 'pending' ? '#F59E0B' : '#10B981' }]} />
                  <View style={styles.apptInfo}>
                    <Text style={styles.apptName}>{getCustomerLabel(a)}</Text>
                    <Text style={styles.apptMeta}>{a.serviceType} • {getVehicleLabel(a)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: a.status === 'pending' ? '#FFFBEB' : '#ECFDF5' }]}>
                    <Text style={[styles.statusText, { color: a.status === 'pending' ? '#D97706' : '#059669' }]}>
                      {a.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
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
  headerText: { flex: 1 },
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
  
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(245,110,15,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#F56E0F' 
  },
  ratingText: { fontSize: 11, fontWeight: '900', color: '#F56E0F' },

  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(245,110,15,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F56E0F' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#F56E0F' },
  logoutIcon: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#F56E0F', borderRadius: 10, padding: 3, borderWidth: 1.5, borderColor: '#1A1A2E' },

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
  scroll: { 
    paddingHorizontal: theme.spacing.screenPadding, 
    paddingTop: 24, 
    paddingBottom: 130 
  },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6' },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '900', color: '#1A1A2E', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: theme.fonts.sizes.sectionTitle, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.3 },
  linkText: { fontSize: 13, fontWeight: '800', color: '#F56E0F', letterSpacing: 0.2 },

  quickLinks: { flexDirection: 'row', gap: 12 },
  quickLink: { flex: 1, alignItems: 'center' },
  quickLinkIconBox: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1.5 },
  quickLinkText: { fontSize: 12, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },

  emptyCard: { backgroundColor: '#FAFAFA', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6', borderStyle: 'dashed' },
  emptyText: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', marginTop: 12 },

  apptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#F3F4F6' },
  apptDot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  apptInfo: { flex: 1 },
  apptName: { fontSize: 15, fontWeight: '900', color: '#1A1A2E' },
  apptMeta: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
}));
