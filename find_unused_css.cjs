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
    const betterClassRegex = /\.([a-zA-Z0-9_-]+)/g;
    let match;
    const classes = new Set();
    while ((match = betterClassRegex.exec(cssContent)) !== null) {
        if (match[1] && isNaN(match[1])) {
            classes.add(match[1]);
        }
    }

    if (classes.size === 0) return;

    let isGlobal = cssFile.endsWith('global.css') || cssFile.endsWith('App.module.css');

    let targetFiles = tsxFiles;
    if (!isGlobal) {
        const baseName = path.basename(cssFile).replace('.module.css', '');
        const specificFiles = tsxFiles.filter(f => path.basename(f).startsWith(baseName));
        if (specificFiles.length > 0) {
            targetFiles = specificFiles;
        }
    }

    targetFiles.push(path.join(srcDir, 'App.tsx'));

    let filesContent = targetFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

    const unused = [];
    classes.forEach(cls => {
        if (!filesContent.includes(cls)) {
            unused.push(cls);
        }
    });

    if (unused.length > 0) {
        unusedClasses[cssFile] = unused;
    }
});

fs.writeFileSync(path.join(__dirname, 'unused_css.json'), JSON.stringify(unusedClasses, null, 2), 'utf8');
