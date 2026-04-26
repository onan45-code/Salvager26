f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    '  const [companyName, setCompanyName] = useState("");',
    '  const [companyName, setCompanyName] = useState("");\n  const [confirmPassword, setConfirmPassword] = useState("");\n  const [showPassword, setShowPassword] = useState(false);\n  const [showConfirmPassword, setShowConfirmPassword] = useState(false);'
)

content = content.replace(
    '    if (!email || !password || !firstName || !lastName || !phone || !zipCode) {\n      Alert.alert("Error", "Please fill in all required fields");\n      return;\n    }',
    '    if (!email || !password || !firstName || !lastName || !phone || !zipCode) {\n      Alert.alert("Error", "Please fill in all required fields");\n      return;\n    }\n    if (password !== confirmPassword) {\n      Alert.alert("Error", "Passwords do not match");\n      return;\n    }'
)

content = content.replace(
    '        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999999" secureTextEntry value={password} onChangeText={setPassword} />',
    '''        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Password" placeholderTextColor="#999999" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Confirm Password" placeholderTextColor="#999999" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>'''
)

content = content.replace(
    '  filterContainer: { gap: 8, marginBottom: 16 },',
    '  filterContainer: { gap: 8, marginBottom: 16 },\n  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },\n  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },\n  eyeText: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold" },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')