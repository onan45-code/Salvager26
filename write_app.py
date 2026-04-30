with open('App.js', 'rb') as f:
    content = f.read()

positions = []
start = 0
while True:
    pos = content.find(b'listing.id', start)
    if pos == -1:
        break
    positions.append(pos)
    start = pos + 1

print(f'Found {len(positions)} occurrences')
for pos in positions[:5]:
    print(repr(content[pos-5:pos+12]))