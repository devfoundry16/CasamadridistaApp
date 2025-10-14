import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountDetailsScreen() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    name: user?.name || "",
  });

  const handleSave = () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.name
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    console.log(formData);
    updateUser({id: user?.id, ...formData});
    Alert.alert("Success", "Account details updated successfully");
  };

  return (
    <>
      <HeaderStack title="Account Details" />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(text) =>
                setFormData({ ...formData, first_name: text })
              }
              placeholder="Enter your first name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(text) =>
                setFormData({ ...formData, last_name: text })
              }
              placeholder="Enter your last name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              placeholder="Enter your display name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
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
    backgroundColor: "#2A2A2A",
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#3A3A3A",
    borderWidth: 1,
    borderColor: "#4A4A4A",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textWhite,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
});
