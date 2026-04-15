import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { usePfpStore } from "../state/pfpStore";
import { useToastStore } from "../state/toast";
import { saveToLocal } from "./fsUtils";

export const validatePfpUri = (uri: string): boolean => {
  try {
    const file = new File(uri);
    return file.exists;
  } catch (error) {
    console.log("Error validating profile picture URI:", error);
    return false;
  }
};

export const getCurrentValidPfpUri = (): string | null => {
  const currentUri = usePfpStore.getState().uri;
  if (!currentUri) return null;

  const isValid = validatePfpUri(currentUri);
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

  return async () => {
    try {
      const imageUri = await pickImage();
      if (!imageUri) return;
      const fileName = `pfp_img.${imageUri.split(".").pop()}`;
      const localUri = saveToLocal(imageUri, "pfp", fileName);

      usePfpStore.getState().setUri(localUri);
      cb?.();
    } catch (err) {
      showToast({
        title: "Error",
        message: "Failed to save image locally",
        delay: 5000,
      });
    }
  };
};
