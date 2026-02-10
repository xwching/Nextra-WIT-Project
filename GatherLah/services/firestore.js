import firestore from "@react-native-firebase/firestore";

// Add a document
export const addDocument = async (collection, data) => {
  try {
    const docRef = await firestore()
      .collection(collection)
      .add({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    console.log("Document added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

// Get all documents from a collection
export const getDocuments = async (collection) => {
  try {
    const snapshot = await firestore().collection(collection).get();
    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return documents;
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

// Get a single document
export const getDocument = async (collection, docId) => {
  try {
    const doc = await firestore().collection(collection).doc(docId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

// Update a document
export const updateDocument = async (collection, docId, data) => {
  try {
    await firestore().collection(collection).doc(docId).update(data);
    console.log("Document updated");
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (collection, docId) => {
  try {
    await firestore().collection(collection).doc(docId).delete();
    console.log("Document deleted");
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Listen to real-time updates
export const subscribeToCollection = (collection, callback) => {
  return firestore()
    .collection(collection)
    .onSnapshot(
      (snapshot) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(documents);
      },
      (error) => {
        console.error("Error subscribing:", error);
      },
    );
};
