f = open('App.js', 'r')
lines = f.readlines()
f.close()

# Add damage state after needsTow
new_lines = []
for line in lines:
    new_lines.append(line)
    if 'const [needsTow, setNeedsTow] = useState(false);' in line:
        new_lines.append('  const [damage, setDamage] = useState("");\n')

# Add damage to save
content = ''.join(new_lines)
content = content.replace(
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos: uploadedPhotos,',
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, photos: uploadedPhotos,'
)

# Add damage buttons before Notes section
content = content.replace(
    '        <Text style={styles.sectionLabel}>Notes</Text>',
    '''        <Text style={styles.sectionLabel}>Damage Level</Text>
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
        </View>
        <Text style={styles.sectionLabel}>Notes</Text>'''
)

# Add new styles
content = content.replace(
    '  toggleActiveRed: { backgroundColor: "#e94560", borderColor: "#e94560" },',
    '  toggleActiveRed: { backgroundColor: "#e94560", borderColor: "#e94560" },\n  toggleYellow: { backgroundColor: "#f1c40f", borderColor: "#f1c40f" },\n  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')