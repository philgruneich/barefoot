'use strict'

var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function(req, res) {
  var filePath = '.' + req.url;

  if (filePath === './') filePath = './test/index.html';

  var extname = path.extname(filePath);
  var contentType;

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    default:
      contentType = 'text/html';
  }


  fs.readFile(filePath, function(error, content) {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
      } else {
        res.writeHead(500);
      }
      res.end();
    } else {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(content, 'utf-8');
    }
  });
}).listen(5000);
