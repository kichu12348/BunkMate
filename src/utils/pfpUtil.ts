import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { PfpState, usePfpStore } from "../state/pfpStore";
import { useToastStore } from "../state/toast";

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
      const fileName = imageUri.split("/").pop();
      if (!fileName) throw new Error("Invalid file name");
      const fileUri = `${FileSystem.documentDirectory}pfp/${fileName}`;
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}pfp/`, {
        intermediates: true, // Create parent directories if they don't exist
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
    const fileUri = usePfpStore.getState().uri;
    const imageUri = await pickImage();
    if (fileUri) {
      // check pfp directory and delete all files
      const pfpDir = `${FileSystem.documentDirectory}pfp/`;
      const files = await FileSystem.readDirectoryAsync(pfpDir);
      await Promise.all(files.map(file => FileSystem.deleteAsync(`${pfpDir}${file}`)));
    }
    if (!imageUri) return;
    const localUri = await saveToLocal(imageUri);
    if (!localUri) return;
    usePfpStore.setState({ uri: localUri } as PfpState);
    cb?.();
  };
};
