import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { Save } from 'lucide-react-native';

export default function AccountDetailsScreen() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    nationality: user?.nationality || '',
    placeOfResidence: user?.placeOfResidence || '',
    annualIncome: user?.annualIncome || '',
  });

  const handleSave = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    updateUser(formData);
    Alert.alert('Success', 'Account details updated successfully');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Account Details',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.textWhite,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              placeholderTextColor={Colors.darkGray}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.darkGray}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              placeholderTextColor={Colors.darkGray}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nationality</Text>
            <TextInput
              style={styles.input}
              value={formData.nationality}
              onChangeText={(text) => setFormData({ ...formData, nationality: text })}
              placeholder="Enter your nationality"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Place of Residence</Text>
            <TextInput
              style={styles.input}
              value={formData.placeOfResidence}
              onChangeText={(text) => setFormData({ ...formData, placeOfResidence: text })}
              placeholder="Enter your place of residence"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Annual Income</Text>
            <TextInput
              style={styles.input}
              value={formData.annualIncome}
              onChangeText={(text) => setFormData({ ...formData, annualIncome: text })}
              placeholder="Select annual income"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={Colors.textWhite} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  form: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textWhite,
  },
});
