'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const morgan = require('morgan');
const fs = require('fs');
const syncRequest = require('sync-request');
const app = express();

app.use(morgan('tiny', { immediate: true }));
app.get('/:path', (req, res) => {
	const path = req.params.path;
    res.download('/data/' + path);
});
app.post('/:path', jsonParser, (req, res) => {
    const path = req.params.path;
    const statusMap = {
        0: '0 - no document with the key identifier could be found',
        1: '1 - document is being edited',
        2: '2 - document is ready for saving',
        3: '3 - document saving error has occurred',
        4: '4 - document is closed with no changes',
        6: '6 - document is being edited, but the current document state is saved',
        7: '7 - error has occurred while force saving the document'
    };
    console.log('status: '+ (req.body.hasOwnProperty("status") ? statusMap[req.body.status] : '?'));

    var updateFile = function (response, body, path) {
        if (body.status == 2) {
            console.log('updating file using url: ' + body.url);
            var file = syncRequest("GET", body.url);
            fs.writeFileSync('/data/' + path, file.getBody());
        }

        response.write("{\"error\":0}");
        response.end();
    }

    var readbody = function (request, response, path) {
        var content = "";
        request.on("data", function (data) {
            content += data;
        });
        request.on("end", function () {
            var body = JSON.parse(content);
            updateFile(response, body, path);
        });
    }

    if (req.body.hasOwnProperty("status")) {
        updateFile(res, req.body, path);
    } else {
        readbody(req, res, path);
    }
});

app.listen(4000, function() {
	console.log('Express server listening on %d, in %s mode', 4000, app.get('env'));
});
