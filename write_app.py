f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    "import { BarCodeScanner } from 'expo-barcode-scanner';",
    "import { CameraView, useCameraPermissions } from 'expo-camera';"
)

content = content.replace(
    """  const handleScan = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access to scan VIN");
      return;
    }
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);
    setVin(data);
    lookupVin(data);
  };""",
    """  const [permission, requestPermission] = useCameraPermissions();

  const handleScan = async () => {
    if (!permission || !permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission needed", "Please allow camera access to scan VIN");
        return;
      }
    }
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);
    setVin(data);
    lookupVin(data);
  };"""
)

content = content.replace(
    "            <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={styles.scanner} />",
    "            <CameraView onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: [\"code39\", \"code128\", \"pdf417\"] }} style={styles.scanner} />"
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')