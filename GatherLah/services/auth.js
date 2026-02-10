import auth from "@react-native-firebase/auth";

// Sign up new user
export const signUp = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
    console.log("User created:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Sign up error:", error.message);
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password,
    );
    console.log("User signed in:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Sign in error:", error.message);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await auth().signOut();
    console.log("User signed out");
  } catch (error) {
    console.error("Sign out error:", error.message);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth().currentUser;
};
