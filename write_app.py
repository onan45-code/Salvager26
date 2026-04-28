f = open('App.js', 'r')
lines = f.readlines()
f.close()

# Insert "Vehicle Delivery" label before the towing toggleRow
new_lines = []
for i, line in enumerate(lines):
    if i == 907:
        new_lines.append('        <Text style={styles.sectionLabel}>Vehicle Delivery</Text>\n')
    new_lines.append(line)
    if i == 908:
        new_lines[len(new_lines)-1] = '          <TouchableOpacity style={[styles.toggleButton, {paddingVertical: 18}, needsTow ? styles.toggleActiveRed : styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>\n'

f = open('App.js', 'w')
f.writelines(new_lines)
f.close()
print('Done!')