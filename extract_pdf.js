const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('LL.pdf');

pdf(dataBuffer).then(function(data) {
    console.log('--- START PDF CONTENT ---');
    console.log(data.text);
    console.log('--- END PDF CONTENT ---');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
