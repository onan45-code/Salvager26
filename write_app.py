f = open('App.js', 'r')
content = f.read()
f.close()

old = """        <Text style={styles.sectionLabel}>Damage Level</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={damage} onValueChange={(val) => setDamage(val)} style={styles.picker}>
            <Picker.Item label="Select Damage Level" value="" />
            <Picker.Item label="No Damage" value="none" />
            <Picker.Item label="Minor Damage" value="minor" />
            <Picker.Item label="Moderate Damage" value="moderate" />
            <Picker.Item label="Major Damage" value="major" />
          </Picker>
        </View>"""

new = """        <Text style={styles.sectionLabel}>Damage Level</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "none" && styles.toggleActive]} onPress={() => setDamage("none")}>
            <Text style={styles.toggleText}>No Damage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "minor" && styles.toggleYellow]} onPress={() => setDamage("minor")}>
            <Text style={styles.toggleText}>Minor</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "moderate" && styles.toggleOrange]} onPress={() => setDamage("moderate")}>
            <Text style={styles.toggleText}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "major" && styles.toggleActiveRed]} onPress={() => setDamage("major")}>
            <Text style={styles.toggleText}>Major Damage</Text>
          </TouchableOpacity>
        </View>"""

content = content.replace(old, new)

# Add yellow style if not there
if 'toggleYellow' not in content:
    content = content.replace(
        '  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },',
        '  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },\n  toggleYellow: { backgroundColor: "#f1c40f", borderColor: "#f1c40f" },'
    )

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')