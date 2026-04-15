import { File, Paths, Directory } from "expo-file-system";

export const saveToLocal = (
  imageUri: string,
  directory: string,
  fileName: string,
) => {
  try {
    const sourceFile = new File(imageUri);
    const destDir = new Directory(Paths.document, directory);
    if (!destDir.exists) {
      destDir.create({ intermediates: true });
    }

    const destFile = new File(destDir, fileName);
    sourceFile.copy(destFile);

    return destFile.uri;
  } catch (error) {
    throw new Error(
      `Failed to save file: ${fileName} to ${directory} directory`,
      { cause: error },
    );
  }
};

export const deleteFromLocal = (uri: string): boolean => {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    return true;
  } catch (error) {
    console.error("deleteFromLocal error:", error);
    return false;
  }
};
