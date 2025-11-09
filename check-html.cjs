const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const errors = [];

// Check for duplicate IDs
const duplicateIds = {};
const idRegex = /id="([^"]+)"/g;
let match;

while ((match = idRegex.exec(html)) !== null) {
    const id = match[1];
    if (duplicateIds[id]) {
        duplicateIds[id]++;
    } else {
        duplicateIds[id] = 1;
    }
}

for (let id in duplicateIds) {
    if (duplicateIds[id] > 1) {
        errors.push(`Duplicate ID: "${id}" appears ${duplicateIds[id]} times`);
    }
}

// Check for unclosed tags
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for common malformed patterns
    if (line.includes('</div') && !line.includes('</div>')) {
        errors.push(`Line ${i + 1}: Possibly unclosed </div tag`);
    }
    if (line.includes('</span') && !line.includes('</span>')) {
        errors.push(`Line ${i + 1}: Possibly unclosed </span tag`);
    }
    if (line.includes('</button') && !line.includes('</button>')) {
        errors.push(`Line ${i + 1}: Possibly unclosed </button tag`);
    }
    if (line.includes('</a') && !line.includes('</a>')) {
        errors.push(`Line ${i + 1}: Possibly unclosed </a tag`);
    }
}

console.log(`Found ${errors.length} errors:\n`);
errors.forEach((err, idx) => {
    console.log(`${idx + 1}. ${err}`);
});

if (errors.length === 0) {
    console.log('No errors found!');
}
