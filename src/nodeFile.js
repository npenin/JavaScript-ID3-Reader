/**
 * Copyright (c) 2010 António Afonso, antonio.afonso gmail, http://www.aadsm.net/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

(function(ns) {
	var fs=require('fs');
    ns["nodeFile"] = function(file, opt_reader) {
        return function(url, fncCallback, fncError) {			
			fs.open(url, 'r', function(err, fd){
				fncCallback(new BinaryNodeFile(fd));
			};
        }
    };
})(this);
