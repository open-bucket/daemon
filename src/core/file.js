/**
 * Lib imports
 */
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const shell = require('shelljs');
const {always, equals} = require('ramda');
const BPromise = require('bluebird');
const {createHash} = require('crypto');

const generateFileName = (rootFileName, numFiles) => `${rootFileName}.part-${numFiles}`;

function splitToDiskP(fileStream, maxFileSize, rootFileName) {
    return new BPromise((resolve, reject) => {
        const partitionNames = [], {highWaterMark: defaultChunkSize} = fileStream._readableState;
        let currentFileSize = 0, currentFileName, openStream = false, finishedWriteStreams = 0, fileStreamEnded = false;

        let currentFileWriteStream;

        const endCurrentWriteStream = () => {
            currentFileWriteStream.end();
            currentFileWriteStream = null;
            currentFileSize = 0;
            openStream = false;
        };

        const resolveAttempt = () => {
            if (fileStreamEnded && equals(partitionNames.length, finishedWriteStreams)) {
                resolve(partitionNames);
            }
        };

        fileStream.on('readable', () => {
            let chunk;
            while (null !== (chunk = fileStream.read(Math.min(maxFileSize - currentFileSize, defaultChunkSize)))) {
                if (!openStream) {
                    currentFileName = generateFileName(rootFileName, partitionNames.length);
                    shell.mkdir('-p', path.dirname(currentFileName));
                    currentFileWriteStream = fs.createWriteStream(currentFileName);
                    currentFileWriteStream
                        .on('finish', () => {
                            finishedWriteStreams++;
                            resolveAttempt();
                        })
                        .on('error', ({message}) => reject(new Error(`Write parts error: ${message}`)));
                    partitionNames.push(currentFileName);
                    openStream = true;
                }

                currentFileWriteStream.write(chunk);
                currentFileSize += chunk.length;

                if (currentFileSize === maxFileSize) {
                    endCurrentWriteStream();
                }
            }
        });

        fileStream.on('end', () => {
            if (currentFileWriteStream) {
                endCurrentWriteStream();
            }
            fileStreamEnded = true;
            resolveAttempt();
        });

        fileStream.on('error', ({message}) => reject(new Error(`Read original file error: ${message}`)));
    });
}

function fileToHashP(filePath) {
    return new BPromise(resolve => {
        const stream = fs.createReadStream(filePath)
            .pipe(createHash('md5'))
            .on('readable', () => {
                const data = stream.read();
                if (data) {
                    resolve(data.toString('hex'));
                }
            });
    });
}

function _mergeFiles(partitionIndex, partitionNames, combinationStream, callback) {
    if (equals(partitionIndex, partitionNames.length)) {
        combinationStream.end();
        return callback();
    }
    let partitionFileStream = fs.createReadStream(partitionNames[partitionIndex]);

    partitionFileStream.on('data', (chunk) => combinationStream.write(chunk));
    partitionFileStream.on('end', () => _mergeFiles(++partitionIndex, partitionNames, combinationStream, callback));
}

function mergePartsToStream(partsPath) {
    let combinationStream = new stream.PassThrough();
    _mergeFiles(0, partsPath, combinationStream, always(null));
    return combinationStream;
}

module.exports = {
    splitToDiskP,
    mergePartsToStream,
    fileToHashP
};
