import { File, Directory, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { PfpState, usePfpStore } from "../state/pfpStore";
import { useToastStore } from "../state/toast";

export const usePfp = () => {
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

  const saveToLocal = (imageUri: string) => {
    try {
      const fileName = imageUri.split("/").pop();
      if (!fileName) throw new Error("Invalid file name");

      const imageDir = new Directory(Paths.document, "pfp");
      if (!imageDir.exists) imageDir.create();

      const destFile = new File(imageUri);

      destFile.move(imageDir);
      return destFile.uri;
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
      const file = new File(fileUri);
      try {
        if (file.exists) {
          file.delete();
        }
      } catch (e) {
        console.log("Error deleting old file:", e);
      }
    }
    if (!imageUri) return;
    const localUri = saveToLocal(imageUri);
    if (!localUri) return;
    usePfpStore.setState({ uri: localUri } as PfpState);
  };
};
