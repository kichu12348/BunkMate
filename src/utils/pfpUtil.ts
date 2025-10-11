import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { usePfpStore } from "../state/pfpStore";
import { useToastStore } from "../state/toast";

export const validatePfpUri = async (uri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  } catch (error) {
    console.log("Error validating profile picture URI:", error);
    return false;
  }
};

export const getCurrentValidPfpUri = async (): Promise<string | null> => {
  const currentUri = usePfpStore.getState().uri;
  if (!currentUri) return null;
  
  const isValid = await validatePfpUri(currentUri);
  if (isValid) {
    return currentUri;
  } else {
    usePfpStore.getState().setUri("");
    return null;
  }
};



export const usePfp = (cb?: () => void) => {
  const showToast = useToastStore.getState().showToast;
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast({
        title: "Permission Denied",
        message: "Permission to access media library is required!",
      });
      return;
    }
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (canceled || !assets || assets.length === 0) return;
    const asset = assets[0];

    if (!asset.uri) {
      showToast({
        title: "Error",
        message: "Could not get image URI",
      });
      return;
    }

    return asset.uri;
  };

  const saveToLocal = async (imageUri: string) => {
    try {
      const timestamp = Date.now();
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `profile_${timestamp}.${fileExtension}`;
      const pfpDir = `${FileSystem.documentDirectory}pfp/`;
      const fileUri = `${pfpDir}${fileName}`;
      
      await FileSystem.makeDirectoryAsync(pfpDir, {
        intermediates: true,
      });
      await FileSystem.copyAsync({ from: imageUri, to: fileUri });
      return fileUri;
    } catch (error) {
      showToast({
        title: "Error",
        message: "Failed to save image locally",
        delay: 5000,
      });
      console.log("saveToLocal error:", error);
      return null;
    }
  };

  return async () => {
    const currentUri = usePfpStore.getState().uri;
    const imageUri = await pickImage();
    if (currentUri) {
      try {
        const pfpDir = `${FileSystem.documentDirectory}pfp/`;
        const dirInfo = await FileSystem.getInfoAsync(pfpDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(pfpDir);
          await Promise.all(files.map(file => FileSystem.deleteAsync(`${pfpDir}${file}`)));
        }
      } catch (error) {
        console.log("Error cleaning up old profile picture:", error);
      }
    }
    
    if (!imageUri) return;
    const localUri = await saveToLocal(imageUri);
    if (!localUri) return;
  
    usePfpStore.getState().setUri(localUri);
    cb?.();
  };
};
