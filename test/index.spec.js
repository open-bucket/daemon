const {Readable} = require('stream');

jest.mock('fs');

describe('index', () => {

    beforeEach(() => {
        require('fs').__setup();
    });

    test('should convert file path array to Result ReadableStream successfully', () => {
        // GIVEN
        const {prepareFiles} = require('../src/obn');

        // WHEN
        const fsReadStreams = prepareFiles(['fs.js', 'firstDir/file1.txt']);

        // THEN
        expect(fsReadStreams.every(s => s.merge() instanceof Readable)).toBe(true);
    });


});