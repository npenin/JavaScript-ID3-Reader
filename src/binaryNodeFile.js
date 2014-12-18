/**
 * @constructor
 */
function BinaryNodeFile(file, iDataOffset, iDataLength) {
	
	this.getRawData = function() {
		return buffer;
	};

	this.getByteAt = function(iOffset) {
		return buffer.readUInt8(iOffset);
	};

    // @aadsm
    this.getBytesAt = function(iOffset, iLength) {
		var result=new Buffer(iLength);
		buffer.copy(result, 0, iOffset, iLength);
        return result;
    };

	this.getLength = function() {
		return buffer.length;
	};

    // @aadsm
    this.isBitSetAt = function(iOffset, iBit) {
        var iByte = this.getByteAt(iOffset);
        return (iByte & (1 << iBit)) != 0;
    };

	this.getSByteAt = function(iOffset) {
		return buffer.readInt8(iOffset);
	};

	this.getShortAt = function(iOffset, bBigEndian) {
		if(bBigEndian)
			return buffer.readUInt16BE(iOffset);
		else
			return buffer.readUInt16LE(iOffset);
	};
	this.getSShortAt = function(iOffset, bBigEndian) {
		if(bBigEndian)
			return buffer.readInt16BE(iOffset);
		else
			return buffer.readInt16LE(iOffset);
	};
	this.getLongAt = function(iOffset, bBigEndian) {
		if(bBigEndian)
			return buffer.readUInt32BE(iOffset);
		else
			return buffer.readUInt32LE(iOffset);
	};
	this.getSLongAt = function(iOffset, bBigEndian) {
		if(bBigEndian)
			return buffer.readInt16BE(iOffset);
		else
			return buffer.readInt16LE(iOffset);
	};
	// @aadsm
	this.getInteger24At = function(iOffset, bBigEndian) {
        var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2);

		var iInteger = bBigEndian ?
			((((iByte1 << 8) + iByte2) << 8) + iByte3)
			: ((((iByte3 << 8) + iByte2) << 8) + iByte1);
		if (iInteger < 0) iInteger += 16777216;
		return iInteger;
    };
	this.getStringAt = function(iOffset, iLength) {
		return buffer.toString(iOffset, iLength);
	
	};

	// @aadsm
	this.getStringWithCharsetAt = function(iOffset, iLength, iCharset) {
		switch( iCharset.toLowerCase() ) {
		    case 'utf-16':
		    case 'utf-16le':
		    case 'utf-16be':
		        return buffer.toString('utf16le', iOffset, iLength);
		    case 'utf-8':
		        return buffer.toString('utf8', iOffset, iLength);
		    default:
		        return StringUtils.readNullTerminatedString(bytes);
		}
	};

	this.getCharAt = function(iOffset) {
		return this.getString(iOffset, 1);
	};
	this.toBase64 = function() {
		return buffer.toString('base64');
	};
	this.fromBase64 = function(strBase64) {
		buffer=new Buffer(strBase64, 'base64');
	};

    this.loadRange = function(range, callback) {
		buffer=new Buffer(range[1]-range[0]);
		fs.read(file, buffer, 0, range[1]-range[0], range[0], function(err, bytesRead, buf){
			buffer=buf;
			callback();
		});
    };
}