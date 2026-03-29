import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BRAND = '#F56E0F';
const WHITE = '#FFFFFF';
const BG = '#F9FAFB';
const TEXT = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const { width } = Dimensions.get('window');

export default function AdminOverviewScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/auth/login' as any);
  };

  const stats = [
    { label: 'Total Revenue', value: 'LKR 2.4M', icon: 'cash-outline', color: '#10B981', trend: '+12%' },
    { label: 'Platform Users', value: '1,284', icon: 'people-outline', color: '#3B82F6', trend: '+5.4%' },
    { label: 'Active Garages', value: '42', icon: 'business-outline', color: BRAND, trend: '+2%' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Platform Admin</Text>
          <Text style={styles.headerTitle}>Overview</Text>
        </View>
        <TouchableOpacity style={styles.avatarBox} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.avatarText}>AD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statLine}>
                <View style={[styles.iconBox, { backgroundColor: s.color + '15' }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <View style={styles.trendBadge}>
                  <Text style={[styles.trendText, { color: s.color }]}>{s.trend}</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ANALYTICS PREVIEW (MOCK) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Growth</Text>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
              {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                <View key={i} style={[styles.bar, { height: h * 1.5, backgroundColor: i === 5 ? BRAND : '#E5E7EB' }]} />
              ))}
            </View>
            <View style={styles.chartLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(l => (
                <Text key={l} style={styles.chartLabel}>{l}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* RECENT LOGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Activity</Text>
            <TouchableOpacity><Text style={styles.linkText}>View Logs</Text></TouchableOpacity>
          </View>
          <View style={styles.logsCard}>
            <View style={styles.logItem}>
              <Ionicons name="add-circle" size={18} color="#10B981" />
              <View style={styles.logInfo}>
                <Text style={styles.logText}>New Service Center registered: "Premium Auto"</Text>
                <Text style={styles.logTime}>2 mins ago</Text>
              </View>
            </View>
            <View style={[styles.logItem, { borderBottomWidth: 0 }]}>
              <Ionicons name="alert-circle" size={18} color="#F59E0B" />
              <View style={styles.logInfo}>
                <Text style={styles.logText}>High server load detected on API Gateway</Text>
                <Text style={styles.logTime}>15 mins ago</Text>
              </View>
            </View>
          </View>
        </View>

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
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerSubtitle: { fontSize: 13, color: MUTED, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: TEXT, letterSpacing: -0.5 },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: WHITE },

  scroll: { padding: 20, paddingBottom: 120 },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  trendText: { fontSize: 10, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 2 },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: '600', textTransform: 'uppercase' },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 16 },
  linkText: { fontSize: 14, fontWeight: '700', color: BRAND },

  chartPlaceholder: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, height: 160, marginBottom: 16 },
  bar: { width: 28, borderRadius: 4 },
  chartLabels: { flexDirection: 'row', gap: 16 },
  chartLabel: { width: 28, textAlign: 'center', fontSize: 12, color: MUTED, fontWeight: '600' },

  logsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  logItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'flex-start' },
  logInfo: { flex: 1 },
  logText: { fontSize: 14, fontWeight: '600', color: TEXT, lineHeight: 20 },
  logTime: { fontSize: 12, color: MUTED, marginTop: 2 },
});
