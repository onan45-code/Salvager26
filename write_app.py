f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    'Array.from({length: 36}, (_, i) => (2025 - i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)',
    'Array.from({length: 36}, (_, i) => (1990 + i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')