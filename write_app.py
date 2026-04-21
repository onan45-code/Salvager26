f = open('App.js', 'r')
content = f.read()
f.close()

old = "import * as Notifications from 'expo-notifications';"
new = "import * as Notifications from 'expo-notifications';\nimport { storage } from './firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"

content = content.replace(old, new)

old2 = "  const handleSubmit = async () => {\n    if (!year || !make || !model) { Alert.alert(\"Error\", \"Please enter year, make and model\"); return; }\n    setLoading(true);\n    try {\n      const user = auth.currentUser;\n      await addDoc(collection(db, \"listings\"), {\n        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos,"

new2 = """  const uploadPhotos = async (photoUris) => {
    const uploadedUrls = [];
    for (const uri of photoUris) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = "listings/" + auth.currentUser.uid + "/" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!year || !make || !model) { Alert.alert("Error", "Please enter year, make and model"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uploadedPhotos = photos.length > 0 ? await uploadPhotos(photos) : [];
      await addDoc(collection(db, "listings"), {
        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos: uploadedPhotos,"""

content = content.replace(old2, new2)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')