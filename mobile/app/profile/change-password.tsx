import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppContext } from '@/context/app-context';
import { AppButton, FormField } from '@/components/ui';

export default function ChangePasswordScreen() {
  const { updatePassword } = React.use(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const success = updatePassword(currentPassword, newPassword);
    if (success) {
      Alert.alert('Success', 'Your password has been changed successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-12 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        <FormField
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
          required
        />
        <FormField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password (min. 6 characters)"
          secureTextEntry
          required
        />
        <FormField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          secureTextEntry
          required
        />
      </View>

      <AppButton label="Update Password" onPress={handleSave} className="mt-2" />
    </ScrollView>
  );
}
