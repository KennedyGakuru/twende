import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'lib/supabase';

const EditProfile: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profileImage: null as string | null,
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // Reduced quality to avoid large files
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        profileImage: result.assets[0].uri,
      }));
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // For Supabase v1, use supabase.auth.user() instead of session()
      const user = supabase.auth.user();
      if (!user) throw new Error('Not authenticated');

      let avatarUrl = null;

      if (formData.profileImage) {
        const localUri = formData.profileImage;
        const filename = localUri.split('/').pop();
        const ext = filename?.split('.').pop() || 'jpg';
        const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

        console.log('Starting upload for path:', filePath);

        try {
          // Method 1: For React Native with Expo, try using FormData
          const formDataUpload = new FormData();
          formDataUpload.append('file', {
            uri: localUri,
            type: `image/${ext}`,
            name: `avatar.${ext}`,
          } as any);

          const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, formDataUpload, { 
              cacheControl: '3600',
              upsert: true 
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          console.log('Upload succeeded. Data:', data);

          // For Supabase v1, use getPublicUrl differently
          const { publicURL, error: urlError } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (urlError) {
            console.error('Error getting public URL:', urlError);
            throw urlError;
          }

          avatarUrl = publicURL;
          console.log('Public URL:', avatarUrl);

        } catch (uploadErr) {
          console.error('Upload failed, trying alternative method:', uploadErr);
          
          // Method 2: Alternative approach using fetch and ArrayBuffer
         
        }
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_name: formData.name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');
      router.back();

    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  useEffect(() => {
  const fetchProfile = async () => {
    const user = supabase.auth.user();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('user_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Failed to load profile', error);
      return;
    }

    setFormData({
      name: data.user_name || '',
      bio: '', // If you want to bring this back later
      profileImage: data.avatar_url || null,
    });
  };

  fetchProfile();
}, []);

  return (
    <SafeAreaView className="flex-1 bg-backgroundLight dark:bg-backgroundDark">
      <ScrollView className="flex-1 bg-backgroundLight dark:bg-backgroundDark p-5">
        {/* Profile Image Section */}
        <View className="items-center mb-8">
          <View className="w-[120px] h-[120px] rounded-full mb-4 relative">
            {formData.profileImage ? (
           <>
           <Image
           source={{ uri: formData.profileImage }}
           className="w-full h-full rounded-full"
           />
           <TouchableOpacity
            className="absolute top-0 right-0 bg-red-500 rounded-full p-2"
           onPress={() => setFormData(prev => ({ ...prev, profileImage: null }))}
          >
         <Ionicons name="close" size={20} color="#FFFFFF" />
         </TouchableOpacity>
           </>
          ) : (
           <View className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center">
          <Text className="font-inter-semibold text-5xl text-blue-500">
          {formData.name.charAt(0).toUpperCase() || '?'}
         </Text>
         </View>
           )}

          </View>
          
          <TouchableOpacity 
            className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 py-2 px-4 rounded-lg"
            onPress={pickImage}
          >
            <Ionicons name="camera" size={20} color="#29B6F6" className="mr-2" />
            <Text className="font-inter-medium text-sm text-blue-500 dark:text-blue-300">
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg mb-6">
            <Text className="font-inter-medium text-sm text-red-500 dark:text-red-300">
              {error}
            </Text>
          </View>
        )}

        {/* Form Section */}
        <View className="mb-6">
          <View className="mb-4">
            <Text className="font-inter-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
              User Name
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 font-inter-regular text-base text-gray-800 dark:text-gray-100"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your user name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg justify-center items-center"
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text className="font-inter-semibold text-base text-gray-700 dark:text-gray-300">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 h-12 bg-blue-400 dark:bg-blue-900/30 rounded-lg justify-center items-center ${
              isSubmitting ? 'opacity-70' : ''
            }`}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text className="font-inter-semibold text-base text-white ">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;