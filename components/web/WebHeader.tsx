import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { logOut } from '@/lib/auth';

export const WebHeader: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const { user, firebaseUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { width } = useWindowDimensions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive breakpoint for web
  const isMobile = width < 768;

  // Active route helpers
  const segList = segments as unknown as string[];
  const currentRoot = segList[0] as string | undefined;
  const currentSub = segList[1] as string | undefined;

  const isRafflesActive =
    (currentRoot === '(tabs)' && (!currentSub || currentSub === 'index')) ||
    (currentRoot === 'raffle' && currentSub !== 'create');
  const isCreateActive = currentRoot === 'raffle' && currentSub === 'create';
  const isProfileActive = currentRoot === '(tabs)' && currentSub === 'profile';
  const isLoginActive = currentRoot === '(auth)' && currentSub === 'login';
  const isRegisterActive = currentRoot === '(auth)' && currentSub === 'register';

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    router.push(path as any);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    try {
      await logOut();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const displayName =
    user?.displayName?.trim() ||
    firebaseUser?.displayName?.trim() ||
    (user?.email || firebaseUser?.email || '').split('@')[0] ||
    t('profile.user');

  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerInner}>
        {/* Left: Brand Logo & Title */}
        <Pressable
          onPress={() => handleNavigate(firebaseUser ? '/(tabs)' : '/(auth)/login')}
          style={({ pressed }) => [
            styles.brandContainer,
            pressed && styles.pressed,
            styles.pointer,
          ]}
          accessibilityRole="link"
          accessibilityLabel={t('auth.appName')}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.brandTextContainer}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>{t('auth.appName')}</Text>
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>2026</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>
              {language === 'es' ? 'Intercambio de Regalos' : 'Gift Exchange'}
            </Text>
          </View>
        </Pressable>

        {/* Center / Desktop Navigation Menu (when width >= 768) */}
        {!isMobile && firebaseUser && (
          <View style={styles.desktopNav}>
            {/* Mis Rifas */}
            <Pressable
              onPress={() => handleNavigate('/(tabs)')}
              style={({ pressed }) => [
                styles.navLink,
                isRafflesActive && styles.navLinkActive,
                pressed && styles.pressed,
                styles.pointer,
              ]}
            >
              <Ionicons
                name={isRafflesActive ? 'gift' : 'gift-outline'}
                size={18}
                color={isRafflesActive ? '#B91C1C' : '#4B5563'}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navLinkText,
                  isRafflesActive && styles.navLinkTextActive,
                ]}
              >
                {t('webHeader.myRaffles')}
              </Text>
            </Pressable>

            {/* Crear Rifa (CTA Button) */}
            <Pressable
              onPress={() => handleNavigate('/raffle/create')}
              style={({ pressed }) => [
                styles.createButton,
                isCreateActive && styles.createButtonActive,
                pressed && styles.pressed,
                styles.pointer,
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={styles.navIcon} />
              <Text style={styles.createButtonText}>
                {t('webHeader.newRaffle')}
              </Text>
            </Pressable>

            {/* Perfil */}
            <Pressable
              onPress={() => handleNavigate('/(tabs)/profile')}
              style={({ pressed }) => [
                styles.navLink,
                isProfileActive && styles.navLinkActive,
                pressed && styles.pressed,
                styles.pointer,
              ]}
            >
              <Ionicons
                name={isProfileActive ? 'person-circle' : 'person-circle-outline'}
                size={18}
                color={isProfileActive ? '#B91C1C' : '#4B5563'}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navLinkText,
                  isProfileActive && styles.navLinkTextActive,
                ]}
              >
                {t('webHeader.profile')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Right Side: Language Switcher, User / Auth, Hamburger */}
        <View style={styles.rightActions}>
          {/* Language Switcher Pill */}
          <Pressable
            onPress={toggleLanguage}
            style={({ pressed }) => [
              styles.langPill,
              pressed && styles.pressed,
              styles.pointer,
            ]}
            accessibilityLabel={t('profile.language')}
          >
            <Text style={styles.langPillText}>
              {language === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
            </Text>
          </Pressable>

          {/* Desktop Auth Controls */}
          {!isMobile && (
            <>
              {firebaseUser ? (
                <View style={styles.userSection}>
                  <Pressable
                    onPress={() => handleNavigate('/(tabs)/profile')}
                    style={({ pressed }) => [
                      styles.userPill,
                      pressed && styles.pressed,
                      styles.pointer,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{userInitial}</Text>
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [
                      styles.logoutButton,
                      pressed && styles.pressed,
                      styles.pointer,
                    ]}
                    accessibilityLabel={t('webHeader.signOut')}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#6B7280" />
                    <Text style={styles.logoutText}>{t('webHeader.signOut')}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.authButtons}>
                  <Pressable
                    onPress={() => handleNavigate('/(auth)/login')}
                    style={({ pressed }) => [
                      styles.loginButton,
                      isLoginActive && styles.navLinkActive,
                      pressed && styles.pressed,
                      styles.pointer,
                    ]}
                  >
                    <Text style={styles.loginButtonText}>{t('webHeader.signIn')}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleNavigate('/(auth)/register')}
                    style={({ pressed }) => [
                      styles.registerButton,
                      isRegisterActive && styles.createButtonActive,
                      pressed && styles.pressed,
                      styles.pointer,
                    ]}
                  >
                    <Text style={styles.registerButtonText}>{t('webHeader.signUp')}</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          {/* Mobile Hamburger Button */}
          {isMobile && (
            <Pressable
              onPress={() => setMobileMenuOpen((prev) => !prev)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.pressed,
                styles.pointer,
              ]}
              accessibilityLabel={mobileMenuOpen ? t('webHeader.closeMenu') : t('webHeader.menu')}
            >
              <Ionicons
                name={mobileMenuOpen ? 'close' : 'menu'}
                size={24}
                color="#374151"
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Mobile Drawer Menu (when open on narrow screens) */}
      {isMobile && mobileMenuOpen && (
        <View style={styles.mobileDrawer}>
          {firebaseUser ? (
            <>
              {/* User Info Card in Drawer */}
              <View style={styles.mobileUserCard}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>{userInitial}</Text>
                </View>
                <View style={styles.mobileUserInfo}>
                  <Text style={styles.mobileUserName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.mobileUserEmail} numberOfLines={1}>
                    {user?.email || firebaseUser?.email || ''}
                  </Text>
                </View>
              </View>

              {/* Navigation Items */}
              <View style={styles.mobileNavList}>
                <Pressable
                  onPress={() => handleNavigate('/(tabs)')}
                  style={({ pressed }) => [
                    styles.mobileNavItem,
                    isRafflesActive && styles.mobileNavItemActive,
                    pressed && styles.pressed,
                    styles.pointer,
                  ]}
                >
                  <Ionicons
                    name={isRafflesActive ? 'gift' : 'gift-outline'}
                    size={20}
                    color={isRafflesActive ? '#B91C1C' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.mobileNavText,
                      isRafflesActive && styles.mobileNavTextActive,
                    ]}
                  >
                    {t('webHeader.myRaffles')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/raffle/create')}
                  style={({ pressed }) => [
                    styles.mobileNavItem,
                    styles.mobileCreateItem,
                    isCreateActive && styles.mobileNavItemActive,
                    pressed && styles.pressed,
                    styles.pointer,
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#B91C1C" />
                  <Text style={[styles.mobileNavText, { color: '#B91C1C', fontWeight: 'bold' }]}>
                    {t('webHeader.newRaffle')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/(tabs)/profile')}
                  style={({ pressed }) => [
                    styles.mobileNavItem,
                    isProfileActive && styles.mobileNavItemActive,
                    pressed && styles.pressed,
                    styles.pointer,
                  ]}
                >
                  <Ionicons
                    name={isProfileActive ? 'person-circle' : 'person-circle-outline'}
                    size={20}
                    color={isProfileActive ? '#B91C1C' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.mobileNavText,
                      isProfileActive && styles.mobileNavTextActive,
                    ]}
                  >
                    {t('webHeader.profile')}
                  </Text>
                </Pressable>

                <View style={styles.mobileDivider} />

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.mobileNavItem,
                    pressed && styles.pressed,
                    styles.pointer,
                  ]}
                >
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                  <Text style={[styles.mobileNavText, { color: '#DC2626' }]}>
                    {t('webHeader.signOut')}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.mobileNavList}>
              <Pressable
                onPress={() => handleNavigate('/(auth)/login')}
                style={({ pressed }) => [
                  styles.mobileNavItem,
                  isLoginActive && styles.mobileNavItemActive,
                  pressed && styles.pressed,
                  styles.pointer,
                ]}
              >
                <Ionicons name="log-in-outline" size={20} color="#B91C1C" />
                <Text style={styles.mobileNavText}>{t('webHeader.signIn')}</Text>
              </Pressable>

              <Pressable
                onPress={() => handleNavigate('/(auth)/register')}
                style={({ pressed }) => [
                  styles.mobileNavItem,
                  isRegisterActive && styles.mobileNavItemActive,
                  pressed && styles.pressed,
                  styles.pointer,
                ]}
              >
                <Ionicons name="person-add-outline" size={20} color="#15803D" />
                <Text style={styles.mobileNavText}>{t('webHeader.signUp')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  yearBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  yearBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: -1,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navLinkActive: {
    backgroundColor: '#FEF2F2',
  },
  navIcon: {
    marginRight: 6,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  navLinkTextActive: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  createButtonActive: {
    backgroundColor: '#991B1B',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 160,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  registerButton: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mobileDrawer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mobileUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  avatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mobileUserInfo: {
    flex: 1,
  },
  mobileUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  mobileUserEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  mobileNavList: {
    gap: 4,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  mobileNavItemActive: {
    backgroundColor: '#FEF2F2',
  },
  mobileCreateItem: {
    backgroundColor: '#FFF1F2',
  },
  mobileNavText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  mobileNavTextActive: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  mobileDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  pressed: {
    opacity: 0.75,
  },
  pointer: Platform.select({
    web: {
      cursor: 'pointer' as any,
    },
    default: {},
  }),
});
