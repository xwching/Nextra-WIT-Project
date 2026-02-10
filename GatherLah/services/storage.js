import storage from "@react-native-firebase/storage";

// Upload a file
export const uploadFile = async (uri, path) => {
  try {
    const reference = storage().ref(path);
    await reference.putFile(uri);
    const url = await reference.getDownloadURL();
    console.log("File uploaded, URL:", url);
    return url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// Delete a file
export const deleteFile = async (path) => {
  try {
    await storage().ref(path).delete();
    console.log("File deleted");
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};
