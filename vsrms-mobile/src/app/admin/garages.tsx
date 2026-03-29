import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#F56E0F';
const WHITE = '#FFFFFF';
const BG = '#F9FAFB';
const TEXT = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const GARAGES = [
  { id: 1, name: 'AutoCare Colombo', address: '123 Main St, Colombo 03', status: 'Verified', owners: 2, users: 15 },
  { id: 2, name: 'Precision Motors', address: '45 Galle Rd, Dehiwala', status: 'Pending', owners: 1, users: 5 },
  { id: 3, name: 'Hybrid Hub Kandy', address: '88 Kandy Rd, Kandy', status: 'Verified', owners: 3, users: 24 },
];

export default function GarageManagementScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Centers</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={MUTED} />
        <TextInput placeholder="Search garages by name or pin..." style={styles.searchInput} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {GARAGES.map(g => (
          <TouchableOpacity key={g.id} style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.nameBlock}>
                <Text style={styles.garageName}>{g.name}</Text>
                <View style={[styles.statusBadge, g.status === 'Verified' ? styles.statusVerified : styles.statusPending]}>
                  <Text style={[styles.statusText, g.status === 'Verified' ? styles.textVerified : styles.textPending]}>
                    {g.status}
                  </Text>
                </View>
              </View>
              <Ionicons name="ellipsis-vertical" size={20} color={MUTED} />
            </View>
            
            <Text style={styles.address}>{g.address}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.miniStat}>
                <Ionicons name="person-circle-outline" size={16} color={MUTED} />
                <Text style={styles.miniStatText}>{g.owners} Owners</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.miniStat}>
                <Ionicons name="people-outline" size={16} color={MUTED} />
                <Text style={styles.miniStatText}>{g.users} Employees</Text>
              </View>
            </View>

            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Manage Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500' },

  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  nameBlock: { flex: 1 },
  garageName: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusVerified: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FFF7ED' },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  textVerified: { color: '#059669' },
  textPending: { color: '#D97706' },

  address: { fontSize: 14, color: MUTED, fontWeight: '500', marginBottom: 16 },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniStatText: { fontSize: 13, fontWeight: '600', color: MUTED },
  statSep: { width: 1, height: 12, backgroundColor: BORDER },

  btnGroup: { flexDirection: 'row', gap: 12 },
  btnOutline: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  btnOutlineText: { fontSize: 13, fontWeight: '700', color: TEXT },
});
