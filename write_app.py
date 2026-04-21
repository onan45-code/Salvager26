f = open('App.js', 'r')
content = f.read()
f.close()

old = "import * as ImagePicker from 'expo-image-picker';"
new = "import * as ImagePicker from 'expo-image-picker';\nimport * as Notifications from 'expo-notifications';"

content = content.replace(old, new)

old2 = "const Stack = createStackNavigator();"
new2 = """const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}"""

content = content.replace(old2, new2)

old3 = """  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "users"), { uid: cred.user.uid, email, userType: "seller" });
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };"""
new3 = """  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await registerForPushNotifications();
      if (token) {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", cred.user.uid)));
        if (!snap.empty) await updateDoc(doc(db, "users", snap.docs[0].id), { pushToken: token });
      }
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await registerForPushNotifications();
      await addDoc(collection(db, "users"), { uid: cred.user.uid, email, userType: "seller", pushToken: token || "" });
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };"""

content = content.replace(old3, new3)

old4 = """      Alert.alert("Success", "Your bid has been placed!");
      navigation.goBack();"""
new4 = """      Alert.alert("Success", "Your bid has been placed!");
      try {
        const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", listing.sellerId)));
        if (!sellerSnap.empty) {
          const sellerToken = sellerSnap.docs[0].data().pushToken;
          if (sellerToken) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: sellerToken,
                title: "New Bid Received!",
                body: "A dealer offered $" + amount + " for your " + listing.year + " " + listing.make + " " + listing.model,
              }),
            });
          }
        }
      } catch(e) {}
      navigation.goBack();"""

content = content.replace(old4, new4)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')