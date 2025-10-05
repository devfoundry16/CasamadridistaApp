import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import {
  User,
  Wallet,
  ShoppingBag,
  Crown,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Camera,
} from 'lucide-react-native';

export default function AccountScreen() {
  const { user, wallet, orders, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (!user) {
    return <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.photoContainer}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <User size={60} color={Colors.darkGray} />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Camera size={16} color={Colors.textWhite} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome {user.fullName}</Text>
          <Text style={styles.descriptionText}>
            Here you can view your membership details, manage your subscription, and update your
            profile information.
          </Text>
        </View>
      </View>

      <View style={styles.dashboardSection}>
        <Text style={styles.sectionTitle}>Dashboard</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/wallet' as any)}
        >
          <Wallet size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Wallet</Text>
            <Text style={styles.menuItemValue}>${wallet.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/orders' as any)}
        >
          <ShoppingBag size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Orders</Text>
            <Text style={styles.menuItemValue}>{orders.length} orders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/subscription' as any)}
        >
          <Crown size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>My Subscription</Text>
            <Text style={styles.menuItemValue}>
              {user.subscription?.plan || 'No active subscription'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/addresses' as any)}
        >
          <MapPin size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Addresses</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/payment-methods' as any)}
        >
          <CreditCard size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Payment methods</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('../account/details' as any)}
        >
          <Settings size={24} color={Colors.accent} />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Account Details</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: logout,
              },
            ]);
          }}
        >
          <LogOut size={24} color={Colors.error} />
          <View style={styles.menuItemContent}>
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Hello <Text style={styles.boldText}>{user.fullName}</Text> (not{' '}
          <Text style={styles.boldText}>{user.fullName}</Text>?{' '}
          <Text style={styles.linkText} onPress={logout}>
            Log out
          </Text>
          )
        </Text>
        <Text style={styles.infoText}>
          From your account dashboard you can view your{' '}
          <Text style={styles.linkText}>recent orders</Text>, manage your{' '}
          <Text style={styles.linkText}>shipping and billing addresses</Text>, and{' '}
          <Text style={styles.linkText}>edit your password and account details</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

function AuthForm({
  isLogin,
  setIsLogin,
}: {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [nationality, setNationality] = useState('');
  const [placeOfResidence, setPlaceOfResidence] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      await login(email, password);
    } else {
      if (!email || !password || !fullName || !phone) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      await register({
        fullName,
        email,
        phone,
        age,
        nationality,
        placeOfResidence,
        annualIncome,
      });
    }
  };

  return (
    <ScrollView style={styles.authContainer}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>{isLogin ? 'Login' : 'Register'}</Text>
        <Text style={styles.authSubtitle}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </Text>
      </View>

      <View style={styles.authForm}>
        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={Colors.darkGray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={Colors.darkGray}
            secureTextEntry
          />
        </View>

        {!isLogin && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.darkGray}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={Colors.darkGray}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nationality</Text>
              <TextInput
                style={styles.input}
                value={nationality}
                onChangeText={setNationality}
                placeholder="Enter your nationality"
                placeholderTextColor={Colors.darkGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Place of Residence</Text>
              <TextInput
                style={styles.input}
                value={placeOfResidence}
                onChangeText={setPlaceOfResidence}
                placeholder="Enter your place of residence"
                placeholderTextColor={Colors.darkGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Annual Income</Text>
              <TextInput
                style={styles.input}
                value={annualIncome}
                onChangeText={setAnnualIncome}
                placeholder="Select annual income"
                placeholderTextColor={Colors.darkGray}
              />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  header: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  photoPlaceholder: {
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  changePhotoText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  dashboardSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    marginBottom: 12,
    gap: 16,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  logoutItem: {
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    color: Colors.error,
  },
  infoBox: {
    margin: 24,
    padding: 20,
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderStyle: 'dashed' as const,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700' as const,
    color: Colors.textWhite,
  },
  linkText: {
    color: Colors.accent,
    textDecorationLine: 'underline' as const,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  authHeader: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  authForm: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textWhite,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: Colors.accent,
    textDecorationLine: 'underline' as const,
  },
});
