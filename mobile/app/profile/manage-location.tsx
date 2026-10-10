import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AppContext } from '@/context/app-context';
import { AppIcon } from '@/components/app-icon';
import { AppButton } from '@/components/ui';
import { LocationPickerModal, type LocationResult } from '@/components/LocationPickerModal';

export default function ManageLocationScreen() {
  const { currentUser, updateUser } = React.use(AppContext);
  const [modalVisible, setModalVisible] = useState(false);

  const handleConfirmLocation = (result: LocationResult) => {
    updateUser({
      location: result.locationName,
      province: result.province,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setModalVisible(false);
    Alert.alert('Location Updated', `Your location has been set to ${result.locationName}, ${result.province}.`);
  };

  return (
    <View className="flex-1 bg-muted p-4">
      {/* Current location card */}
      <View className="rounded-[14px] bg-card p-5 border border-border mb-6">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="size-10 rounded-full bg-primary/10 items-center justify-center">
            <AppIcon name="location" size={22} color="#16A34A" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] text-muted-foreground font-medium">Current Location</Text>
            <Text className="text-lg font-bold text-foreground">
              {currentUser?.location || 'Not set'}, {currentUser?.province || ''}
            </Text>
          </View>
        </View>

        {currentUser?.latitude && currentUser?.longitude ? (
          <View className="bg-muted p-3 rounded-[10px] mt-2">
            <Text className="text-xs text-muted-foreground">
              Coordinates: {currentUser.latitude.toFixed(5)}, {currentUser.longitude.toFixed(5)}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-muted-foreground mt-1">
            No precise coordinates saved yet. Select a location on the map to save coordinates.
          </Text>
        )}
      </View>

      <AppButton
        label="Select Location on Map"
        onPress={() => setModalVisible(true)}
      />

      <LocationPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmLocation}
        initialLatitude={currentUser?.latitude}
        initialLongitude={currentUser?.longitude}
      />
    </View>
  );
}
