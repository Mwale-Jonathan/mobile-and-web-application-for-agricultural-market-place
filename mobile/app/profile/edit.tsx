import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppContext } from '@/context/app-context';
import { AppButton, AvatarInitials, FormField } from '@/components/ui';

export default function EditProfileScreen() {
  const { currentUser, updateUser } = React.use(AppContext);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required.');
      return;
    }

    updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-12 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center py-4 bg-card rounded-[14px] border border-border">
        <AvatarInitials
          name={name || currentUser?.name || 'U'}
          color={currentUser?.avatarColor || '#16A34A'}
          size="lg"
        />
      </View>

      <View className="gap-4">
        <FormField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          required
        />
        <FormField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          required
        />
        <FormField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+260 97..."
          keyboardType="phone-pad"
          required
        />
      </View>

      <AppButton label="Save Changes" onPress={handleSave} className="mt-2" />
    </ScrollView>
  );
}
