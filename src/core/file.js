/**
 * Lib imports
 */
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const shell = require('shelljs');
const {always, equals} = require('ramda');
const BPromise = require('bluebird');

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

function _mergeFiles(partitionIndex, partitionNames, combinationStream, callback) {
    if (equals(partitionIndex, partitionNames.length)) {
        combinationStream.end();
        return callback();
    }
    let partitionFileStream = fs.createReadStream(partitionNames[partitionIndex]);

    partitionFileStream.on('data', (chunk) => combinationStream.write(chunk));
    partitionFileStream.on('end', () => _mergeFiles(++partitionIndex, partitionNames, combinationStream, callback));
}

function mergeFilesToDiskP(partitionNames, outputPath) {
    return new BPromise((resolve) => {
        shell.mkdir('-p', path.dirname(outputPath));
        let combinationStream = fs.createWriteStream(outputPath);
        _mergeFiles(0, partitionNames, combinationStream, resolve);
    });
}

function mergeFilesToStreamP(partitionNames) {
    return new BPromise(resolve => {
        let combinationStream = new stream.PassThrough();
        resolve(combinationStream);
        _mergeFiles(0, partitionNames, combinationStream, always(null));
    });
}

module.exports = {
    splitToDiskP,
    mergeFilesToStreamP,
    mergeFilesToDiskP
};
