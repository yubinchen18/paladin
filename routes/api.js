var express = require('express');
var router = express.Router();
var request = require('request-promise');
var xml2json = require('xml2json');
var mcache = require('memory-cache');
var connection = require('../database');

/**
 * ALL ROUTES:
 * /
 * /agencies
 * /agencies/{agencyTag}
 * /agencies/{agencyTag}/routes                                         (optional with ?verbose&terse)
 * /agencies/{agencyTag}/routes/{routeTag}                              (optional with ?verbose&terse)
 * /agencies/{agencyTag}/routes/{routeTag}/stopIds/{stopId}
 * /agencies/{agencyTag}/routes/{routeTag}/stopTags/{stopTag}
 * /agencies/{agencyTag}/stopIds/{stopId}
 * /agencies/{agencyTag}/stopTags/{stopTags}                            (multiple stopTags can be used, seperate with '-')
 * /agencies/{agencyTag}/routes/{routeTag}/schedules
 * /agencies/{agencyTag}/routes/{routeTag}/vehicleLocations/{lastTime}  (lastTime is optional and defaults 0)
 * /agencies/{agencyTag}/messages               
 * /agencies/{agencyTag}/messages/{routeTag}                            (multiple routeTags can be used, seperate with '-')
 * /requests
 * /slowest
 * 
 */

// log each request, write record to db
router.use(function(req, res, next) {
    var log = {
        method: req.method,
        url : req.originalUrl
    };

    connection.query('INSERT INTO request_logs SET ?', log, function (error, results, fields) {
        if (error) throw error;
        req.lastInsertId = results.insertId;
        next();
    });
});

// caching mechanism
var cache = function(duration) {
    return function(req, res, next) {
        let key = '__express__' + req.originalUrl || req.url;
        let cachedBody = mcache.get(key);
        if (cachedBody) {
            res.set('Content-Type', 'application/json');
            res.send(cachedBody);
            connection.query('UPDATE request_logs SET response_time = ? WHERE id = ?', [res.get('X-Response-Time'), req.lastInsertId], function(err, result){
                if(err) throw err;
                return;
            });
        } else {
            res.sendResponse = res.send;
            res.send = function(body) {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body);
            };
            next();
        }
    };
};

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Yubin\'s code assessment for Paladin Studios!' });
});

/*
 * Agencies index
 * http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList
 */
router.get('/agencies', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'agencyList'
        }
    };
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch(function (err) {
            console.log(err);
            res.render('error');
        });
});

/*
 * Agencies view
 * http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=<agency_tag>
 */
router.get('/agencies/:agencyTag', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'routeList',
            a : req.params.agencyTag
        }
    };
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * Routes index of an agency with options verbose or terse
 * http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=<agency_tag>
 */
router.get('/agencies/:agencyTag/routes', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'routeConfig',
            a : req.params.agencyTag
        }
    };
    
    //read options verbose or terse
    if (req.query) {
        for (var property in req.query) {
            options.qs[property] = req.query[property];
        }
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * Route view of an agency with options verbose or terse
 * http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=<agency_tag>&r=<route tag>
 */
router.get('/agencies/:agencyTag/routes/:routeTag', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'routeConfig',
            a : req.params.agencyTag,
            r : req.params.routeTag
        }
    };
    
    //read options verbose or terse
    if (req.query) {
        for (var property in req.query) {
            options.qs[property] = req.query[property];
        }
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * predictions
 * StopId view of a route of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop id>&routeTag=<route tag>
 */
router.get('/agencies/:agencyTag/routes/:routeTag/stopIds/:stopId', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'predictions',
            a : req.params.agencyTag,
            stopId : req.params.stopId,
            r : req.params.routeTag
        }
    };
    
    if (req.query) {
        for (var property in req.query) {
            options.qs[property] = req.query[property];
        }
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * predictions
 * StopTag view of a route of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&r=<route tag>&s=<stop tag>
 */
router.get('/agencies/:agencyTag/routes/:routeTag/stopTags/:stopTag', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'predictions',
            a : req.params.agencyTag,
            r : req.params.routeTag,
            s : req.params.stopTag
        }
    };
    
    if (req.query) {
        for (var property in req.query) {
            options.qs[property] = req.query[property];
        }
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * predictions
 * StopIds index of all routes of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop id>
 */
router.get('/agencies/:agencyTag/stopIds/:stopId', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'predictions',
            a : req.params.agencyTag,
            stopId : req.params.stopId
        }
    };
    
    if (req.query) {
        for (var property in req.query) {
            options.qs[property] = req.query[property];
        }
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * predictions
 * One or multiple stopTags of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops&a=<agency_tag>&stops=<stop 1>&stops=<stop 2>&stops=<stop 3>
 */
router.get('/agencies/:agencyTag/stopTags/:stopTags', cache(120), function(req, res, next) {
    //prepare and concact stops for query string
    let stopTags = req.params.stopTags.split('-');
    let stopsString = '';
    for (var stop in stopTags) {
        stopsString = stopsString + '&stops=' + stopTags[stop];
    }
    
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops&a=' + req.params.agencyTag + stopsString
    };
    
    //add optional query string params if necessary
    if (req.query) {
        let queryString = '';
        for (var property in req.query) {
            queryString += '&' + property + '=' + req.query[property];
        }
        options.uri += queryString;
    }
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * schedules
 * schedule index of routes of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=schedule&a=<agency_tag>& r=<route_tag>
 */
router.get('/agencies/:agencyTag/routes/:routeTag/schedules', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'schedule',
            a : req.params.agencyTag,
            r : req.params.routeTag
        }
    };
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * vehicleLocations
 * vehicleLocations index of all routes of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=<agency_tag>&r=<route tag>&t=<epoch time in msec>
 */
router.get('/agencies/:agencyTag/routes/:routeTag/vehicleLocations/:lastTime?*', cache(120), function(req, res, next) {
    if (typeof req.params.lastTime === 'undefined') {
        req.params.lastTime = 0;
    }
   
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'vehicleLocations',
            a : req.params.agencyTag,
            r : req.params.routeTag,
            t : req.params.lastTime
        }
    };
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * messages
 * messages index of all routes of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=messages&a=<agency tag>
 */
router.get('/agencies/:agencyTag/messages', cache(120), function(req, res, next) {
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs : {
            command : 'messages',
            a : req.params.agencyTag
        }
    };
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * messages
 * messages of one or multiple routes of an agency
 * http://webservices.nextbus.com/service/publicXMLFeed?command=messages&a=<agency tag>&r=<route tag1>&r=<route tagN>
 */
router.get('/agencies/:agencyTag/messages/:routeTags', cache(120), function(req, res, next) {
    //prepare and concact routes for query string seperated by '-'
    let routes = req.params.routeTags.split('-');
    let routesString = '';
    for (var route in routes) {
        routesString = routesString + '&r=' + routes[route];
    }
    
    let options = {
        method : 'GET',
        uri : 'http://webservices.nextbus.com/service/publicXMLFeed?command=messages&a=' + req.params.agencyTag + routesString
    };
    
    request(options)
        .then(function (response) {
            let jsonResponse = xml2json.toJson(response);
            res.set('Content-Type', 'application/json');
            res.send(jsonResponse);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
});

/*
 * requests stats
 */
router.get('/requests', function(req, res, next) {
    connection.query('SELECT url, COUNT(*) AS `num` FROM  request_logs GROUP BY url ORDER BY `url` DESC LIMIT 100', function(err, result){
        if(err) throw err;
        res.json(result);
        next();
    });
});

/*
 * get 5 slowest
 */
router.get('/slowest', cache(120), function(req, res, next) {
    connection.query('SELECT * FROM request_logs ORDER BY response_time DESC LIMIT 5', function(err, result){
        if(err) throw err;
        res.json(result);
        next();
    });
});


// update log record with response time after response is sent
router.use(function(req, res, next) {
    connection.query('UPDATE request_logs SET response_time = ? WHERE id = ?', [res.get('X-Response-Time'), req.lastInsertId], function(err, result){
        if(err) throw err;
    });
});


module.exports = router;
