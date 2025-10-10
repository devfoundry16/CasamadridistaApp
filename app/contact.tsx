import Colors from '@/constants/colors';
import * as MailComposer from 'expo-mail-composer';
import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ContactScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim() || !comment.trim()) {
      Alert.alert('Missing Information', 'Please fill in your name, email, and comment.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable && Platform.OS === 'web') {
        const subject = encodeURIComponent('Contact Form Submission');
        const body = encodeURIComponent(
          `Name: ${firstName} ${lastName}\n` +
          `Email: ${email}\n` +
          `Phone: ${phone}\n\n` +
          `Message:\n${comment}`
        );
        const mailtoLink = `mailto:petrenkoviacheslav52@gmail.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
        return;
      }

      if (!isAvailable) {
        Alert.alert('Email Not Available', 'Email service is not available on this device.');
        return;
      }

      const result = await MailComposer.composeAsync({
        recipients: ['petrenkoviacheslav52@gmail.com'],
        subject: 'Contact Form Submission',
        body: `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${comment}`,
      });

      if (result.status === 'sent') {
        Alert.alert('Success', 'Your message has been sent successfully!');
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setComment('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  };

  return (
    <>
    <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Contact",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{ uri: 'https://casamadridista.com/wp-content/uploads/2025/05/img3.png' }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Contact</Text>
          <View style={styles.breadcrumb}>
            <Link href="/" style={styles.breadcrumbLink}>
              <Text style={styles.breadcrumbLinkText}>Home</Text>
            </Link>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            <Text style={styles.breadcrumbCurrent}>Contact</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.mainSection}>
          <View style={styles.leftSection}>
            <Text style={styles.mainTitle}>Your Voice Matters - Contact Us</Text>
            <Text style={styles.mainDescription}>
              Have questions, suggestions, or partnership ideas? We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.
            </Text>
            <Image
              source={{ uri: 'https://casamadridista.com/wp-content/uploads/2025/09/4353454353.webp' }}
              style={styles.teamImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formSection}>
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor="#666"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#666"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroupFull}>
              <Text style={styles.label}>Comment</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Comment"
                placeholderTextColor="#666"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.submitButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  hero: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    opacity: 0.3,
  },
  heroOverlay: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 12,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbLink: {
    textDecorationLine: 'none',
  },
  breadcrumbLinkText: {
    fontSize: 14,
    color: Colors.accent,
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: Colors.textWhite,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: Colors.textWhite,
  },
  content: {
    padding: 20,
  },
  mainSection: {
    flexDirection: 'row',
    gap: 40,
    flexWrap: 'wrap',
  },
  leftSection: {
    flex: 1,
    minWidth: 300,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 16,
    lineHeight: 40,
  },
  mainDescription: {
    fontSize: 15,
    color: '#b0b0b0',
    lineHeight: 24,
    marginBottom: 0,
  },
  teamImage: {
    width: '100%',
    height: 300,
  },
  formSection: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formGroup: {
    flex: 1,
  },
  formGroupFull: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: Colors.textWhite,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textWhite,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
});
