f = open('App.js', 'r')
content = f.read()
f.close()

# Add showPassword state
content = content.replace(
    '  const [confirmPassword, setConfirmPassword] = useState("");',
    '  const [confirmPassword, setConfirmPassword] = useState("");\n  const [showPassword, setShowPassword] = useState(false);\n  const [showConfirmPassword, setShowConfirmPassword] = useState(false);'
)

# Replace password input with eye icon version
content = content.replace(
    '        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999999" secureTextEntry value={password} onChangeText={setPassword} />\n            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999999" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />',
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

# Add styles
content = content.replace(
    '  filterContainer: { gap: 8, marginBottom: 16 },',
    '  filterContainer: { gap: 8, marginBottom: 16 },\n  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },\n  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },\n  eyeText: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold" },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')