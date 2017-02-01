var http = require('https');
var sanitizer = require('sanitize-html');
var S = require('string');
var docs = [];
//process.on('message', function (msg) {
//    var index = msg.index;
//    var type = msg.type;
//    var file = msg.file;
//    var category = msg.category;

    //optional jika crawling berita dapat dilist yg sudah di crawl
//    var last_crawl = msg.last_crawl;
    var list_url;
    var config = {
        rexDate: /<div class="tanggal">.*<\/div>/ig,
        rexTitle: /<div class="hotnews">([\s\S]*?)<\/h1>/ig,
        rexAuthor: /<strong>\((.*?)\)<\/strong>/ig,
        rexContent: /<tr class="data-table-row">([\s\S]*?)<\/tr>/ig,
        rexUrl: /<div>[\s]+.*<a href="http:\/\/www.bloomberg.com\/read(.*)<\/a>/ig
    };

    var options = {
        host: 'www.bloomberg.com',
        path: '/energy'
    };
    list_berita(options);

    function list_berita(option) {
    	console.log('start');
    	crawl('https://' + options.host + options.path);
    }

    function crawl(url) {
    	console.log('url ' + url);
        var request = http.get(url, function (response) {
            var html = '';
            response.on('data', function (chunk) {
                html += chunk;
            });

            response.on('end', function () {
                try  {
                	//console.log('html ' + html);
                    var matches;
                    matches = html.match(config.rexContent);
                    if (matches !== null) {
                    	console.log('mathes ' + matches[1]);
//                        doc.body['full_article'] = cleanHtml(matches[0]).trim().split(/\n|\r\n|\r|\t/).join(' ');
//                        doc.body['synopsis'] = doc.body['full_article'].split('.')[0];
                    }
                    docs.push(doc);
                } catch (e) {
                }
            });
        }).on('error', function (e) {
            console.log("Got error: " + e.message);
        });
        request.setTimeout(30000, function () {
            if (docs.length > 0) {
                process.send(docs);
                process.exit();
            } else
                process.exit(1);
        });
    }
    function cleanHtml(body) {
        var stripped = sanitizer(body, {
            //allowedTags: ['h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'],
            allowedTags: [],
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                // We don't currently allow img itself by default, but this
                // would make sense if we did
                img: ['src']
            },
            // Lots of these won't come up by default because we don't allow them
            selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
            // URL schemes we permit
            allowedSchemes: ['http', 'https', 'ftp', 'mailto']
        });

        stripped = stripped.split('&lrm;').join('');

        return S(stripped).decodeHTMLEntities().s;
    }
//});
//# sourceMappingURL=crawl_jpnn.js.map
