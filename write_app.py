f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    '  const [damage, setDamage] = useState("");\n',
    ''
)

content = content.replace(
    '        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>\n          <Text style={styles.sectionLabel}>Damage Level</Text>\n          <Text style={{color: "#aaaaaa", fontSize: 12}}>scroll to select</Text>\n        </View>\n        <View style={styles.pickerContainer}>\n          <Picker selectedValue={damage} onValueChange={(val) => setDamage(val)} style={styles.picker}>\n            <Picker.Item label="Select Damage Level" value="" />\n            <Picker.Item label="No Damage" value="none" />\n            <Picker.Item label="Minor Damage" value="minor" />\n            <Picker.Item label="Moderate Damage" value="moderate" />\n            <Picker.Item label="Major Damage" value="major" />\n          </Picker>\n        </View>',
    ''
)

content = content.replace(
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, photos: uploadedPhotos,',
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos: uploadedPhotos,'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')