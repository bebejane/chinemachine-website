var google      = require('googleapis');
var async       = require('async');
var googleAuth  = require('google-auth-library');

var TOKEN_DIR;
var TOKEN_PATH;
var SCOPES      = ['https://www.googleapis.com/auth/calendar'];
var AUTH_CODE   = "4/MDDqIk4x4RB1BTxCLdFoFyxba1FF6PL6Q77SoPNXd-w";
var DEFAULT_CALENDAR = "5is7bmolc9d1ie0ai9b4gk2qek@group.calendar.google.com";

function GoogleCalendar(options){
  
  if(!options) options = {}

  var self = this;

  self.clientSecret;
  self.clientId;
  self.redirectUrl;
  self.auth;
  self.oauth2Client;
  self.calendar;
  self.colors;
  self.calendars;
  self.calendarID = options.google_calendar || DEFAULT_CALENDAR;
  self.RATE_LIMIT = 300;
  self.RATE_LIMIT_LAST = moment();

  self.init = function(cb){

    TOKEN_DIR   = __dirname + '/google;
    TOKEN_PATH  = TOKEN_DIR + '/calendar-api-quickstart.json';  

    // Load client secrets from a local file.
    fs.readFile(TOKEN_DIR + '/calendar_client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        cb('Error loading client secret file: ' + err);
        return;
      }

      // Authorize a client with the loaded credentials, then call the
      // Google Calendar API.
      self.authorize(JSON.parse(content), function(client){

        self.calendar = google.calendar({version:'v3'});

        self.getCalendars(function(err, clndrs){

          if(err){
            cb(err)
            return;
          }
          console.log(clndrs)
          for (var i = clndrs.length-1, whID = 0; i >= 0; i--) {
            if(clndrs[i].summary.toLowerCase().indexOf("chinemachine") < 0)
              clndrs.splice(i,1);
            else
              clndrs[i].warehouseID = clndrs[i].summary.toLowerCase() === 'chinemachine' ? 1 : 2;
          };

          self.calendars = clndrs.sort(function(a,b){return a.warehouseID > b.warehouseID});
          self.getColors(function(err, colrs){
            self.colors = colrs;
            cb(err)
          })
        })
      });
    });
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  self.authorize = function(credentials, callback) {

    self.clientSecret = credentials.installed.client_secret;
    self.clientId = credentials.installed.client_id;
    self.redirectUrl = credentials.installed.redirect_uris[0];
    self.auth = new googleAuth();
    self.oauth2Client = new self.auth.OAuth2(self.clientId, self.clientSecret, self.redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        self.getNewToken(self.oauth2Client, callback);
      } else {
        self.oauth2Client.credentials = JSON.parse(token);
        callback(self.oauth2Client);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  self.getNewToken = function(oauth2Client, callback) {

    if(!oauth2Client){
      self.auth = new googleAuth();
      self.oauth2Client = new self.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "http://localhost");
    }

    var authUrl = self.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);

    self.oauth2Client.getToken(AUTH_CODE, function(err, token) {
      if (err) {
        callback(err)
        return;
      }
      self.oauth2Client.credentials = token;
      self.storeToken(token);
      callback(self.oauth2Client);
    });

  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  self.storeToken = function(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }

  self.getCalendars = function(cb) {

    if(!cb)
      cb = nocb;

    self.calendar.calendarList.list({
      auth: self.oauth2Client

    }, function(err, response) {
      if (err) {
        console.log(err)
        cb('The API returned an error: ' + err);
        return;
      }
      var cals = response.items;

      if (cals.length == 0) {
        cb('No calendars found.');
      } else {
          cb(null,cals)

      }
    });
  }


  /**
   * Lists the next 10 events on the user's primary calendar.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  self.getEvents = function(year, month, cb) {

    var date = moment(new Date(year + "-" + month + "-01"))
    date.hour(0)
    var startTime = date.toISOString();
    date.month(month+1)
    var endTime = date.toISOString();

    self.calendar.events.list({
      auth: self.oauth2Client,
      calendarId: self.calendarID,
      timeMin: startTime,
      timeMax: endTime,
      maxResults: 200,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      
      if (err) {
        cb('The API returned an error: ' + err);
        return;
      }
      
      cb(null,response.items)

    });
  }

  self.getEventsByWeeks = function(year, month, calendarID, cb){

     var m = moment(new Date(year + "-" + month + "-01"));
     var firstWeekday = (7-m.endOf("week").day() === 0 ? 6 : m.endOf("week").day()+1);
     var lastWeekday = m.endOf("month").day();
     var lastDay = m.endOf("month").date();
    
     var dateFrom = moment(new Date(year + "-" + month + "-01")).subtract(firstWeekday-1, "days");
     var dateTo = moment(new Date(year + "-" + month + "-01")).add(lastDay+(7-lastWeekday)-1, "days");
     
     self.getEventsRange(dateFrom, dateTo, calendarID, cb)

  }

  self.getEventsRange = function(dateFrom, dateTo, calendarID, cb, results, pageToken) {

    if(!calendarID)
      calendarID = self.calendarID;
    
    dateFrom = moment(dateFrom)
    dateTo = moment(dateTo)

    dateFrom.hour(0)
    dateFrom.minute(0)
    dateFrom.second(0)
    dateTo.hour(23)
    dateTo.minute(59)
    dateTo.second(59)

    var startTime = dateFrom.toISOString();
    var endTime = dateTo.toISOString();

    self.calendar.events.list({
      auth: self.oauth2Client,
      calendarId: calendarID,
      timeMin: startTime,
      timeMax: endTime,
      maxResults: 200,
      singleEvents: true,
      pageToken:pageToken,
      orderBy: 'startTime'
    }, function(err, response) {
      
      if (err) {
        cb('The API returned an error: ' + err);
        return;
      }
      
      var events = response.items;

      if(!results) 
          results = []
      
      results = results.concat(events);

      if(response.nextPageToken)
        self.getEventsRange(dateFrom, dateTo, calendarID, cb, results, response.nextPageToken);
      else{
        
        cb(null,self._addExtraInfo(calendarID, results))
      }

      
    });
  }

  self.getEventsByDate = function(date, cb, calendarID){

    if(!date) date = new Date();

    var calendarID = calendarID ? calendarID : self.calendarID;
    
    var sdate = moment(date)
    var edate = moment(date)

    sdate.hours(0)
    sdate.minutes(0)
    sdate.seconds(0)
    var startTime = sdate.toISOString();
    
    edate.hours(23)
    edate.minutes(59)
    edate.seconds(59)
    var endTime = edate.toISOString();
    //console.log(startTime + " " + endTime)
    self.calendar.events.list({
      auth: self.oauth2Client,
      calendarId: calendarID,
      timeMin: startTime,
      timeMax: endTime,
      maxResults: 200,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      
      if (err) {
        cb('The API returned an error: ' + err);
        return;
      }
      
      var events = response.items;
      if (events.length === 0) {
        cb(null, []);
      } else {
          cb(null,self._addExtraInfo(calendarID, events))

      }
    });



  }
  self.getColors = function(cb){

    self.calendar.colors.get({
      auth: self.oauth2Client
    }, function(err, response) {
      if (err) {
        cb('The API returned an error: ' + err);
        return;
      }
      
      var c = response.event;
      if (c.length == 0) {
        cb('No colors found.');
      } else {
          
          cb(null,c)

      }
    });
  }

  self.setCalendar = function(id){
    self.calendarID = id;
  }


  self.addEvent = function(calendarID, name, date, colorID, cb){
    /*
    if(moment().valueOf() - self.RATE_LIMIT_LAST.valueOf() < self.RATE_LIMIT)
      return setTimeout(self.addEvent, 50, calendarID, name, date, colorID, cb)

    self.RATE_LIMIT_LAST = moment();
    */
    if(!calendarID)
      calendarID = self.calendarID;

    if(Array.isArray(date)){
      self.addEvents(calendarID, name, date, colorID, cb);
      return;
    }
    
    var dateFrom, dateTo;

    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);

    dateFrom = moment(date).format("YYYY-MM-DD")

    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);

    dateTo = moment(date).format("YYYY-MM-DD")

    var new_event = {
      summary: name,
      start:{
        date: dateFrom
      },
      end: {
        date: dateTo
      },
      colorId:colorID
    }
    
    self.calendar.events.insert({
      auth: self.oauth2Client,
      calendarId: calendarID,
      resource: new_event
    }, function(err, response) {

      if (err) {
        cb('The API returned an error: ' + err);
        console.log(err)
        return;
      }
      else{
        cb(null,self._addExtraInfo(calendarID, response));
      }
    });

  }

  self.addEvents = function(calendarID, name, dates, colorID, cb){

    var funcs = [];
    
    for (var i = 0; i < dates.length; i++)
        funcs.push(function(callback){ self.addEvent(calendarID, name, this, colorID, callback)}.bind(dates[i]))
    
    async.series(funcs, function(err, results){
      cb(err,self._addExtraInfo(calendarID, results))
    })

  }
  self.deleteEvent = function(calendarID, eventID, cb){
    /*
    if(moment().valueOf() - self.RATE_LIMIT_LAST.valueOf() < self.RATE_LIMIT)
      return setTimeout(self.deleteEvent, 50, calendarID, eventID, cb)

    self.RATE_LIMIT_LAST = moment();
    */
    if(!calendarID)
      calendarID = self.calendarID;
    
    self.calendar.events.delete({
      auth: self.oauth2Client,
      calendarId: calendarID,
      eventId: eventID
    }, function(err, response) {
      if (err) {
        console.log(err)
        console.log(response)
        cb('The API returned an error: ' + err);
        console.log(err)
        return;
      }
      else{
        cb(null, eventID);
      }
    });

  }
  
  self.shareCalendar = function(email, calendarID, cb){

    self.calendar.acl.insert({
      auth: self.oauth2Client,
      calendarId: calendarID,
      resource: {
        role: "reader",
          scope: {
            type: "user",
            value: email
          }
      }
    }, function(err, response) {
      if (err) {
        cb('The API returned an error: ' + err);
        console.log(err)
        return;
      }
      else
        cb(err, response);
    });

  }
  self.shareToAllCalendars = function(email, cb){

      var funcs = [];

      for (var i = 0; i < self.calendars.length; i++)
        funcs.push(function(callback){ self.shareCalendar(email, this, callback); }.bind(self.calendars[i].id));

      async.parallel(funcs, cb);
  }

  self.unshareCalendar = function(email, calendarID, cb){

    self.calendar.acl.delete({
      auth: self.oauth2Client,
      calendarId: calendarID,
      ruleId:"user:" + email
    }, function(err, response) {
      if (err) {
        cb('The API returned an error: ' + err);
        console.log(err)
        return;
      }
      else{
        cb(err, response);
      }
    });
  }

  self.unshareToAllCalendars = function(email, cb){

      var funcs = [];

      for (var i = 0; i < self.calendars.length; i++)
        funcs.push(function(callback){ self.unshareCalendar(email, this, callback); }.bind(self.calendars[i].id));

      async.parallel(funcs, cb);

  }

  self.getCalendarUsers = function(calendarID, cb){

    if(!calendarID) calendarID = self.calendarID;

    self.calendar.acl.list({
      auth: self.oauth2Client,
      calendarId: calendarID
    }, function(err, response) {
      if (err) {
        return cb('The API returned an error: ' + err);
      }
      else{
        cb(err, response);
      }
    });

  }
  self.removeEvents = function(calendarID, dateFrom, dateTo, cb){

      if(!calendarID) calendarID = self.calendarID;
      
      self.getEventsRange(dateFrom, dateTo, calendarID, function(err, evts){

        var funcs = []
        for (var i = 0; evts && i < evts.length; i++){
          funcs.push(function(callback){ 
            self.deleteEvent(calendarID,this, callback);
          }.bind(evts[i].id)); 
        }

        if(!funcs.length) 
          return cb();
        
        async.parallelLimit(funcs,5,cb)

      })
    }
    self.removeEventsByMonth = function(year, month, cb){

      var dateFrom = moment(new Date(year, month,1)).hour(0).minute(0).second(0);
      var dateTo = moment(dateFrom).date(dateFrom.daysInMonth()).hour(23).minute(59).second(59);
      
      var funcs = []

      for (var i = 0; i < self.calendars.length; i++) {
          funcs.push(function(c){
            self.removeEvents(this.id, dateFrom, dateTo, c);
          }.bind(self.calendars[i])) 
      }
      return async.series(funcs, cb);
    }
    self.getWarehouseID = function(calendarID){
      for (var i = 0; i < self.calendars.length; i++) {
        if(self.calendars[i].id === calendarID)
          return(self.calendars[i].warehouseID)
      }
      return false;
    }
    self._addExtraInfo = function(calendarID, events){
      if(!events) return [];

      if(!Array.isArray(events))
        events = [events];

      for (var i = 0; i < events.length; i++){
          events[i].calendarID = calendarID.toString();
          events[i].warehouseID = self.getWarehouseID(calendarID.toString());
      }
      return events;
    }
}
module.exports = GoogleCalendar;