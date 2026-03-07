const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findFiles(dir, exts, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, exts, fileList);
        } else if (exts.some(ext => filePath.endsWith(ext))) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const cssFiles = findFiles(srcDir, ['.css']);
const tsxFiles = findFiles(srcDir, ['.tsx', '.ts']);

const unusedClasses = {};

cssFiles.forEach(cssFile => {
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    const classRegex = /\.([a-zA-Z0-9_-]+)(?![^{]*})/g; // Match classes outside of rules, roughly
    // Better regex: match .className {
    const betterClassRegex = /\.([a-zA-Z0-9_-]+)/g;
    let match;
    const classes = new Set();
    while ((match = betterClassRegex.exec(cssContent)) !== null) {
        // Filter out pseudo classes or decimal numbers
        if (match[1] && isNaN(match[1])) {
            classes.add(match[1]);
        }
    }

    if (classes.size === 0) return;

    let isGlobal = cssFile.endsWith('global.css');

    let targetFiles = tsxFiles;
    if (!isGlobal) {
        const baseName = path.basename(cssFile).replace('.module.css', '');
        const specificFiles = tsxFiles.filter(f => path.basename(f).startsWith(baseName));
        if (specificFiles.length > 0) {
            targetFiles = specificFiles;
        }
    }

    // Also include App.tsx for some global components
    targetFiles.push(path.join(srcDir, 'App.tsx'));

    let filesContent = targetFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

    const unused = [];
    classes.forEach(cls => {
        // we check for `styles.${cls}` or `'${cls}'` or `"${cls}"` or `styles['${cls}']` or just the word
        // Since it's naive, we can just check if the exact string exists in the file content
        if (!filesContent.includes(cls)) {
            unused.push(cls);
        }
    });

    if (unused.length > 0) {
        unusedClasses[cssFile] = unused;
    }
});

console.log(JSON.stringify(unusedClasses, null, 2));
