var http = require('http');
var sanitizer = require('sanitize-html');
var S = require('string');
var docs = [];
process.on('message', function (msg) {
    var index = msg.index;
    var type = msg.type;
    var file = msg.file;
    var category = msg.category;

    //optional jika crawling berita dapat dilist yg sudah di crawl
    var last_crawl = msg.last_crawl;
    var list_url;
    var config = {
        rexDate: /<div itemprop="datePublished" class="date">.*<\/div>/ig,
        rexTitle: /<h1(.*?)<\/h1>/ig,
        rexAuthor: /<div itemprop="author"([\s\S]*?)<\/div>/ig,
        rexContent: /<span itemprop="description">([\s\S]*?)<\/span>/ig,
        rexUrl: /<a href=([\s\S]*?)<div class="upperdeck"><span class="channel ">([\s\S]*?)<div class="thumbcontainer">([\s\S]*?)<\/div>([\s\S]*?)<div class="title">.*/ig
    };

    var options = {
        host: 'www.viva.co.id',
        path: '/indeks?page=1'
    };
    list_berita(options);

    function list_berita(option) {
        var req = http.request(options, function (response) {
            var html = '';
            response.on('data', function (chunk) {
                html += chunk;
            });

            response.on('end', function () {
                list_url = html.match(config.rexUrl);
                var rex = /<a href="(.*?)"/i;
                for (var i in list_url) {
                    list_url[i] = list_url[i].match(rex)[0].replace(/<a href="/, '').replace('"', '');
                }

                //to do check paging + batas yg dicrawl
                var url = list_url.pop();
                if (url != undefined)
                    crawl(url);
            });
        });
        req.on('error', function (err) {
            console.log(err);
        });
        req.setTimeout(30000, function () {
            process.exit(1);
        });
        req.end();
    }

    function crawl(url) {
        var doc = { index: index, type: type, body: {} };
        doc.body["media"] = "viva.co.id";
        doc.body["sub"] = "viva.news";
        doc.body['url'] = url;
        doc.body['category'] = category;
        var request = http.get(url, function (response) {
            var html = '';
            response.on('data', function (chunk) {
                html += chunk;
            });

            response.on('end', function () {
                try  {
                    var matches;
                    matches = html.match(config.rexTitle);
                    if (matches !== null) {
                        doc.body['title'] = cleanHtml(matches[0]).trim();
                    }

                    matches = html.match(config.rexDate);
                    if (matches !== null) {
                        var a = cleanHtml(matches[0]).trim();
                        a = a.split(' ');
                        var months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
                        var date = new Date(a[3] + ' ' + (months.indexOf(a[2].toLowerCase()) + 1) + ' ' + a[1] + ' ' + a[5]);
                        doc.body['date'] = date.getFullYear() + '/' + ((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '/' + (date.getDate() > 9 ? date.getDate() : '0' + date.getDate()) + ' ' + (date.getHours() > 9 ? date.getHours() : '0' + date.getHours()) + ':' + (date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes()) + ':' + (date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds());
                    }
                    matches = html.match(config.rexAuthor);
                    if (matches !== null) {
                        doc.body['author'] = cleanHtml(matches[0]).trim().split(/\n|\r\n|\r|\t/).join(' ');
                    } else
                        doc.body['author'] = '-';
                    matches = html.match(config.rexContent);
                    if (matches !== null) {
                        doc.body['full_article'] = cleanHtml(matches[0]).trim().split(/\n|\r\n|\r|\t/).join(' ');
                        doc.body['synopsis'] = doc.body['full_article'].replace(/.*\.co.id/i, '').split('.')[0];
                    }
                    docs.push(doc);
                } catch (e) {
                }
                var url = list_url.pop();
                if (url != undefined)
                    crawl(url);
                else {
                    process.send(docs);
                    process.exit();
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
});
//# sourceMappingURL=crawl_viva.js.map
