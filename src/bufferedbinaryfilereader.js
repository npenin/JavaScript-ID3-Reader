var BufferedBinaryFileReader = function(file, fncCallback, fncError) {
    /**
     * @class Reads a remote file without having to download it all.
     *
     * Creates a new BufferedBinaryFile that will download chunks of the file pointed by the URL given only on a per need basis.
     *
     * @param {string} strUrl The URL with the location of the file to be read.
     * @param {number} iLength The size of the file.
     * @param {number} [blockSize=2048] The size of the chunk that will be downloaded when data is read.
     * @param {number} [blockRadius=0] The number of chunks, immediately after and before the chunk needed, that will also be downloaded.
     *
     * @constructor
     * @augments BinaryFile
     */
    function BufferedBinaryFile(file, iLength, blockSize, blockRadius) {
        var undefined;
        var downloadedBytesCount = 0;
        var binaryFile = new BinaryFile("", 0, iLength);
        var blocks = [];

        blockSize = blockSize || 1024 * 2;
        blockRadius = (typeof blockRadius === "undefined") ? 0 : blockRadius;
        blockTotal = ~~((iLength - 1) / blockSize) + 1;

        function getBlockRangeForByteRange(range) {
            var blockStart = ~~(range[0] / blockSize) - blockRadius;
            var blockEnd = ~~(range[1] / blockSize) + 1 + blockRadius;

            if (blockStart < 0)
                blockStart = 0;
            if (blockEnd >= blockTotal)
                blockEnd = blockTotal - 1;

            return [blockStart, blockEnd];
        }

        // TODO: wondering if a "recently used block" could help things around
        //       here.
        function getBlockAtOffset(offset) {
            var blockRange = getBlockRangeForByteRange([offset, offset]);
            waitForBlocks(blockRange);
            return blocks[~~(offset / blockSize)];
        }

        /**
         * @param {?function()} callback If a function is passed then this function will be asynchronous and the callback invoked when the blocks have been loaded, otherwise it blocks script execution until the request is completed.
         */
        function waitForBlocks(blockRange, callback) {
            // Filter out already downloaded blocks or return if found out that
            // the entire block range has already been downloaded.
            while (blocks[blockRange[0]]) {
                blockRange[0]++;
                if (blockRange[0] > blockRange[1])
                    return callback ? callback() : undefined;
            }
            while (blocks[blockRange[1]]) {
                blockRange[1]--;
                if (blockRange[0] > blockRange[1])
                    return callback ? callback() : undefined;
            }
            var range = [blockRange[0] * blockSize, (blockRange[1] + 1) * blockSize - 1];
            //console.log("Getting: " + range[0] + " to " +  range[1]);

            var reader = new FileReader();
            reader.onload = function(event) {

                var size = event.loaded;
                // Range header not supported
                if (size == iLength) {
                    blockRange[0] = 0;
                    blockRange[1] = event.total - 1;
                    range[0] = 0;
                    range[1] = iLength - 1;
                }
                var block = {
                    data: event.target.result,
                    offset: range[0]
                };

                for (var i = blockRange[0]; i <= blockRange[1]; i++) {
                    blocks[i] = block;
                }
                downloadedBytesCount += range[1] - range[0] + 1;
                if (callback)
                    callback();
            };
            reader.readAsBinaryString(file.slice(range[0], range[1]));
        }

        // Mixin all BinaryFile's methods.
        // Not using prototype linking since the constructor needs to know
        // the length of the file.
        for (var key in binaryFile) {
            if (binaryFile.hasOwnProperty(key) &&
                    typeof binaryFile[key] === "function") {
                this[key] = binaryFile[key];
            }
        }
        /** 
         * @override
         */
        this.getByteAt = function(iOffset) {
            var block = getBlockAtOffset(iOffset);
            if (typeof block.data == "string") {
                return block.data.charCodeAt(iOffset - block.offset) & 0xFF;
            } else if (typeof block.data == "unknown") {
                return IEBinary_getByteAt(block.data, iOffset - block.offset);
            }
        };

        /**
         * Gets the number of total bytes that have been downloaded.
         *
         * @returns The number of total bytes that have been downloaded.
         */
        this.getDownloadedBytesCount = function() {
            return downloadedBytesCount;
        };

        /**
         * Downloads the byte range given. Useful for preloading.
         *
         * @param {Array} range Two element array that denotes the first byte to be read on the first position and the last byte to be read on the last position. A range of [2, 5] will download bytes 2,3,4 and 5.
         * @param {?function()} callback The function to invoke when the blocks have been downloaded, this makes this call asynchronous.
         */
        this.loadRange = function(range, callback) {
            var blockRange = getBlockRangeForByteRange(range);
            waitForBlocks(blockRange, callback);
        };
    }

    function init() {

        fncCallback(new BufferedBinaryFile(file, file.size));
    }

    init();
};