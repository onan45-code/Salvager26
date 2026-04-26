f = open('App.js', 'r')
content = f.read()
f.close()

old = """        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Confirm Password" placeholderTextColor="#999999" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>"""

new = """        {mode === "signup" && (
          <View style={styles.passwordRow}>
            <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Confirm Password" placeholderTextColor="#999999" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
        )}"""

content = content.replace(old, new)
f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')