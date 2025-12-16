import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { PricingCard } from '../../src/components/PricingCard';
import { checkoutService, PRICING_PLANS, PricingPlan } from '../../src/services/checkoutService';
import { tradeService } from '../../src/services/tradeService';

function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement,
  danger 
}: { 
  icon: string; 
  title: string; 
  subtitle?: string; 
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color="#666" />)}
    </TouchableOpacity>
  );
}

export default function SettingsTab() {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [pricingModalVisible, setPricingModalVisible] = useState(false);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!plan.action) return;
    
    setPricingModalVisible(false);
    
    const result = await checkoutService.initiateCheckout(plan.id);
    if (!result.success) {
      Alert.alert('Checkout Error', result.message || 'Failed to start checkout');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Demo Account',
      'This will reset your balance to $100,000 and clear all positions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Demo account has been reset');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isAuthenticated && user ? (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={28} color="#00FFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.username || user.email.split('@')[0]}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{user.subscriptionTier || 'Free'}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.signInCard} onPress={() => router.push('/(auth)/login')}>
            <View style={styles.signInIcon}>
              <Ionicons name="person-add" size={24} color="#00FFFF" />
            </View>
            <View style={styles.signInContent}>
              <Text style={styles.signInTitle}>Sign In</Text>
              <Text style={styles.signInSubtitle}>Access all features</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.upgradeCard} onPress={() => setPricingModalVisible(true)}>
          <View style={styles.upgradeIcon}>
            <Ionicons name="flash" size={28} color="#00FFFF" />
          </View>
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Upgrade to Pulse Pro</Text>
            <Text style={styles.upgradeSubtitle}>Unlock real trading & unlimited AI</Text>
          </View>
          <View style={styles.upgradeBadge}>
            <Text style={styles.upgradeBadgeText}>$8/mo</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="👤"
            title="Demo Account"
            subtitle="Paper trading with $100K balance"
          />
          <SettingItem
            icon="📊"
            title="Trading History"
            subtitle="View past trades and performance"
            onPress={() => router.push('/(tabs)/portfolio')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingItem
            icon="🔔"
            title="Notifications"
            subtitle="Price alerts and trade updates"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#333', true: 'rgba(0, 255, 255, 0.5)' }}
                thumbColor={notifications ? '#00FFFF' : '#666'}
              />
            }
          />
          <SettingItem
            icon="🌙"
            title="Dark Mode"
            subtitle="Currently active"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  if (!value) {
                    Alert.alert('Theme', 'Only dark mode is available in this version');
                  }
                  setDarkMode(true);
                }}
                trackColor={{ false: '#333', true: 'rgba(0, 255, 255, 0.5)' }}
                thumbColor={darkMode ? '#00FFFF' : '#666'}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="❓"
            title="Help & FAQ"
            onPress={() => Alert.alert('Help', 'Visit our support center for assistance.')}
          />
          <SettingItem
            icon="🐛"
            title="Report a Bug"
            onPress={() => Alert.alert('Report Bug', 'Thank you for helping improve Pulse!')}
          />
          <SettingItem
            icon="📧"
            title="Contact Us"
            onPress={() => Alert.alert('Contact', 'Email: support@darkwavestudios.io')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <SettingItem
            icon="📄"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            icon="🔒"
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingItem
            icon="⚠️"
            title="Risk Disclaimer"
            onPress={() => Alert.alert('Risk Disclaimer', 'Cryptocurrency trading involves significant risk. Never invest more than you can afford to lose.')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <SettingItem
            icon="🔄"
            title="Reset Demo Account"
            subtitle="Clear all positions and reset balance"
            onPress={handleResetDemo}
            danger
          />
          {isAuthenticated && (
            <SettingItem
              icon="🚪"
              title="Sign Out"
              subtitle="Log out of your account"
              onPress={handleLogout}
              danger
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pulse by DarkWave Studios v2.0.0</Text>
          <Text style={styles.footerText}>© 2024 DarkWave Studios</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={pricingModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPricingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Plan</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPricingModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PRICING_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
            ))}
            <View style={styles.modalFooter}>
              <View style={styles.guarantee}>
                <Ionicons name="shield-checkmark" size={20} color="#00FFFF" />
                <Text style={styles.guaranteeText}>Secure payment via Stripe</Text>
              </View>
              <View style={styles.guarantee}>
                <Ionicons name="refresh" size={20} color="#00FFFF" />
                <Text style={styles.guaranteeText}>Cancel anytime</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  userAvatar: {
    width: 52,
    height: 52,
    backgroundColor: '#1a1a1a',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00FFFF',
  },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  signInIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signInContent: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signInSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
  },
  upgradeIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00FFFF',
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  upgradeBadge: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  settingIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  settingTitleDanger: {
    color: '#FF8888',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#555',
    marginVertical: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guaranteeText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 10,
  },
});
