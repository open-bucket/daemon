/**
 * Lib imports
 */
const realFs = require.requireActual('fs');
const {Readable} = require('stream');

// const DEFAULT_DIR_PATH = `${__dirname}/temp-dir`;

const DEFAULT_FILES = {
    'firstDir/file1.txt': 'text in file 1',
    'firstDir/file2.txt': 'text in file 2',
    'fs.js': realFs.createReadStream(`${__dirname}/fs.js`)
};

let mockFiles;

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `mockFs` APIs are used.
function __setup(files = DEFAULT_FILES) {
    mockFiles = files;
}

/**
 * Mock implementation of the mock function
 * Throws error if path not found,
 * return Read Stream of content if found in mockFiles
 */
function createReadStream(path) {
    const fileContent = mockFiles[path];
    if (fileContent) {
        return fileContent instanceof Readable
            ? fileContent
            : new Readable({read: () => this.push(fileContent)});
    } else {
        throw new Error(`ENOENT: no such file or directory, open ${path}`);
    }
}

const mockFs = {
    ...jest.genMockFromModule('fs'),
    __setup,
    createReadStream
};

module.exports = mockFs;