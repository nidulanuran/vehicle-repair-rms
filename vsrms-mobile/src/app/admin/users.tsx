import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#F56E0F';
const WHITE = '#FFFFFF';
const BG = '#F9FAFB';
const TEXT = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const USERS = [
  { id: 1, name: 'John Perera', email: 'john@example.com', role: 'Vehicle Owner', status: 'Active' },
  { id: 2, name: 'Saman Silva', email: 'saman@autocare.com', role: 'Garage Owner', status: 'Active' },
  { id: 3, name: 'Admin User', email: 'admin@vsrms.com', role: 'Platform Admin', status: 'Active' },
  { id: 4, name: 'Kasun Bandara', email: 'kasun@gmail.com', role: 'Technician', status: 'Suspended' },
];

export default function UserManagementScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Directory</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={20} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {USERS.map(u => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userMain}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name.split(' ').map(n=>n[0]).join('')}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{u.role}</Text>
              </View>
              <View style={[styles.statusPill, u.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusPillText, u.status === 'Active' ? styles.textActive : styles.textInactive]}>
                  {u.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: WHITE,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: TEXT, letterSpacing: -0.5 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

  scroll: { padding: 20, paddingBottom: 120 },
  userCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  userMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  avatarText: { fontSize: 16, fontWeight: '800', color: TEXT },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 2 },
  userEmail: { fontSize: 13, color: MUTED, fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '800', color: MUTED, textTransform: 'uppercase' },

  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  textActive: { color: '#059669' },
  textInactive: { color: '#DC2626' },
});
