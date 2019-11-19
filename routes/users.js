var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a GOD');
});

router.get('/gaga', function(req, res, next) {
  res.send('respond with a gaga');
});

module.exports = router;
