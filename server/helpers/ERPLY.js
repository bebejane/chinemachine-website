var util 	= require("util");
var qs 		= require("querystring");
var fs 		= require("fs");
var async 	= require("async");
var moment 	= require("moment");
var request = require('request')
var colors = require('colors')

const log = (arg,arg2,arg3) =>{
	const msg = '[ERPLY] - ' + arg;
	console.log(msg.dim.grey)
	
}
const isNetworkError = (err) => {
	log(err.code || err)
	log('is network error?')
	return false;
}

function ERPLY(user, pass, code, warehouseID){

	var self					= this;

	self.USERNAME				= user;
	self.PASSWORD 				= pass;
	self.CLIENT_CODE 			= code;
	self.WAREHOUSE_ID			= parseInt(warehouseID) || 1;
	self.DISPLAY_WAREHOUSE_ID	= self.WAREHOUSE_ID;

	self.customers;
	self.brands;
	self.products;
	self.product_groups;
	self.pcategories;

	self.SESSION_KEY			= null;
	self.API_ENDPOINT			= "https://" + self.CLIENT_CODE + ".erply.com/api/";
	self.API_DELAY_REQUESTS 	= 0;
	self.REQ_QUEUE				= []
	self.REQ_QUEUE_RUNNING		= false
	self.REQ_QUEUE_TIMEOUT		= null;
	self.REQ_QUEUE_DELAY		= 400;
	self.REQUEST_ID				= 0;

	self.WH_GROUP;
	self.BI_GROUP;
	self.NT_GROUP;
	self.GC_GROUP;

	self.ERPLY_GROUPS = [];
	self.ERPLY_BRANDS = [];
	self.ERPLY_CATEGORIES = [];
	self.ERPLY_REGISTERS = [];
	self.ERPLY_WAREHOUSES = [];
	self.ERPLY_EMPLOYEES = [];
	self.ERPLY_PRICES = [];
	self.ERPLY_DESCRIPTIONS = [];
	self.ERPLY_COLORS = [];
	
	self.USER_GROUP_ADMIN = 1;
	self.USER_GROUP_SALES = 7;
	self.USER_GROUP_MANAGER = 10;
	self.USER_GROUP_PRODUCT_MANAGER = 11;
	self.USER_GROUPS = [self.USER_GROUP_ADMIN, self.USER_GROUP_MANAGER, self.USER_GROUP_PRODUCT_MANAGER, self.USER_GROUP_SALES];
	self.USER_GROUP_ARCHIVED = 9;
	

	self.EAN_DEFAULT_START_CODE = 10000000;
	self.EAN_START_CODE 		= (10000000 * self.WAREHOUSE_ID);
	self.EAN_CODE 		 		= -1;

	self.GIFTCARD_START_CODE 	= (10000000 * self.WAREHOUSE_ID);

	self.worker;
	self.worker_cbs = {};

	self.REQS_SERVED = 0;
	self.REQS_SERVED_THIS_HOUR  = 0;
	self._REQS_SERVED_THIS_HOUR  = {date:moment(), count:0};
	self.STARTED_AT = new Date();
	self._SESSION_KEY_CHECK;
	self.HTTP_DEBUG_MODE = false;

	self.INIT_DONE = false;
	self.CLOSED_DOWN = false;

	self.init = function(cb){

		if(!self.WAREHOUSE_ID || self.WAREHOUSE_ID < 1)
			return cb("No ERPLY location set in Settings. Please go to Settings and choose location.")

		self.SESSION_KEY = null;

		self._getSessionKey(function(err, session_key){

			if(err) return cb(err);
			
			var funcs = []

			funcs.push(function(c){self._getInitData(c);})
			funcs.push(function(c){self._getLastEANCode(c);})
			//funcs.push(function(c){self.getObjects("descriptions",c);})
			async.parallel(funcs, function(err, data){
				
				self.INIT_DONE = true;

				if(err) return cb(err)
				
				var result = data[0];
				var ean_code = data[1]
				var descriptions = []//data[2] || []

				if(!ean_code) 
					return cb("Can't get initial barcode ID")
				else
					self.EAN_CODE = ean_code;

				
				self.ERPLY_GROUPS = result.getProductGroups.result;
				self.ERPLY_REGISTERS = result.getPointsOfSale.result;
				self.ERPLY_EMPLOYEES = result.getEmployees.result;
				self.ERPLY_BRANDS = result.getBrands.result;
				self.ERPLY_CATEGORIES = result.getProductCategories.result;
				self.ERPLY_WAREHOUSES = result.getWarehouses.result;
				self.ERPLY_DESCRIPTIONS = descriptions;
				self.ERPLY_PRICES = self.getPrices();

				for (var i = 0; i < self.ERPLY_WAREHOUSES.length; i++)
					self.ERPLY_WAREHOUSES[i].warehouseID = parseInt(self.ERPLY_WAREHOUSES[i].warehouseID);
				
				self.BI_GROUP = self.getBuyinGroup()
				self.WH_GROUP = self.getWarehouseGroup()
				self.NT_GROUP = self.getNoTicketGroup()
				self.GC_GROUP = self.getGiftcardGroup()
				
				log(self.ERPLY_WAREHOUSES.length + " warehouses");
				log(self.ERPLY_REGISTERS.length + " registers");
				log(self.ERPLY_EMPLOYEES.length + " employees");
				log(self.ERPLY_GROUPS.length + " groups");
				log(self.ERPLY_CATEGORIES.length + " categories");
				log(self.ERPLY_BRANDS.length + " brands");
				log(self.ERPLY_PRICES.length + " prices");
				
				cb(null)
			})
		});

	}

	self._getInitData = function(cb){

		if(!cb) cb = function(e, r){log(r)}

		var cmds = []
		var groups = {cmd:"getProductGroups", recordsOnPage:500}
		var pos = {cmd: "getPointsOfSale", warehouseID:self.WAREHOUSE_ID, recordsOnPage:500};
		var emp = {cmd:"getEmployees", recordsOnPage:500};
		var brands = {cmd:"getBrands", recordsOnPage:500}
		var cats = {cmd:"getProductCategories", recordsOnPage:500}
		var warehouses = {cmd:"getWarehouses", recordsOnPage:500}
		var query = self.generateMultiReq(null, [groups,pos,emp,brands,cats,warehouses]);
		return self.sendMultiRequest(query,cb);
	}

	self.verifyUser = function(username, password, cb){
		
		return self.sendRequest("verifyUser", {username:username, password:password}, function(err, u){

			if(err || u.length === 0){

				if(err)
					cb("Login failed: " + (err.description || err.message || err.toString()));
				else
					cb("Wrong username or password biatch!")
			}
			else{
				
				u[0].isAdmin = self.isAdmin(u[0]);
				cb(null, u[0])
			}

		});
	}

	self.logout = function(){

		self.SESSION_KEY = null;

	}

	self.sendRequest = function(command, params, cb, queue, records, request_id, attempts){

		if(self.CLOSED_DOWN) return;

		/*
		if(!navigator.onLine){
			if(attempts<3)
				setTimeout(self.sendRequest, 5000, command, params, cb, queue, records, request_id, (attempts ? ++attempts : 1 ));
			else
				cb({code:'ENOTFOUND', message:"Internet connection is down!"});
			return;
		}
		*/
		if(!cb) cb = function(){};

		if((!self.SESSION_KEY && command !== "verifyUser") || 
			 (command !== "verifyUser" && self.SESSION_KEY && self.SESSION_KEY.expires < new Date()) ||
			 (command === "verifyUser" && params.username && params.password && self.SESSION_KEY && self.SESSION_KEY.expires < new Date())){

			if(self.SESSION_KEY && self.SESSION_KEY.expires < (new Date()))
				log("ERPLY SESSION EXPIRED")

			return self._getSessionKey(function(err, session_key, org_cb){

				if(!err && session_key){
					self.sendRequest(command, params, org_cb);
				}
				else{
					
					if(cb){
						self.emit("loginfailed", "Can't get ERPLY session ID!")
						cb(err);
					}
				}

			}, cb)
		}

		if(!records)
			records = [];

		params = params || {};
		
		if(!queue){

			if(command !== "multi")
				request_id = ++self.REQUEST_ID;
			else if(params && params.length>0)
				request_id = params[0].request_id;

			self.REQ_QUEUE.push({command:command, params:params, cb:cb, idx:self.REQ_QUEUE.length-1, request_id:request_id, records:records});

			if(!self.REQ_QUEUE_RUNNING)
				self._checkRequestQueue();

		return;
		}

		var form;

		

		if(command === "multi")
			form = {form:{requests:JSON.stringify(params), clientCode:self.CLIENT_CODE, sessionKey:self.SESSION_KEY.key}};
		else{
			
			params.request = command;
			params.clientCode = self.CLIENT_CODE
			params.version = "1.0";

			if(!params.recordsOnPage)
				params.recordsOnPage = 1000;

			if(!params.pageNo)
				params.pageNo = 1;

			if(self.SESSION_KEY)
				params.sessionKey = self.SESSION_KEY.key

		 	form = {form:params}
		 	
		 	log("[" + self.REQS_SERVED_THIS_HOUR + "/" + self.REQS_SERVED + "/" + request_id + "] " + "ERPLY single query: " + command)
		}
		
		self.doRequest(command, params, form, null, request_id, function(err, result, reqId){
			cb(err, result);
		});

	return request_id;
	}

	self.doRequest = function(command, params, form, records, request_id, cb){
		
		if(moment().hour() !== self._REQS_SERVED_THIS_HOUR.date.hour()){
			log("Request's served between " + self._REQS_SERVED_THIS_HOUR.date.format("HH") + "h - " + moment().format("HH") + "h: " +  self._REQS_SERVED_THIS_HOUR.count + " (" + self.REQS_SERVED +")")
			self._REQS_SERVED_THIS_HOUR = {date: moment(), count:0 }
		}

		self.REQS_SERVED++;
		self.REQS_SERVED_THIS_HOUR = ++self._REQS_SERVED_THIS_HOUR.count
		
		var reqTime = new Date().getTime()
		
		var req = request.post(self.API_ENDPOINT, form, function (error, response, body) {
				
			if(error){
				if(error && error.code && isNetworkError(error.code))
					cb({code:err.code, message:"Internet connection is down"}, null, request_id)
				else
					cb(error, null, request_id);

				cb = null
				return;
			}
			
			if(body){

				try{
					
					var result = JSON.parse(body)
					var recordsTotal = 0;
					var recordsOnPage = params.recordsOnPage ? params.recordsOnPage : 0;
					var isMultiCommand = false;
					var isSingleCommand = false;
					var multiCommands = [];

					if(!result)
						return cb(null, null, request_id);

					// MULTI ERROR
					if(result.requests){
						for(var i = 0; i < result.requests.length; i++){
							if(result.requests[i].status && result.requests[i].status.errorCode){
								return cb(self.erplyError(result.requests[i].status.errorCode, result.requests[i].status), null, request_id);
							}
						}
					}

					if(result.status.errorCode === 0 && (!result.records && !result.requests))
						return cb(null,null,request_id);
					
					if(result && (result.records || result.requests)){

						var status = result.status;
						var requests = result.requests ? result.requests : []
						
						// SINGLE COMMAND
						if(result.records){

							recordsTotal = status.recordsTotal;
							result = result.records;
							isSingleCommand = true;
							
						} else{
							log('requests multi')
							// Multi request
							isMultiCommand = true;
							var req_result = [];
							var reqs = {}
							form.form.requests = JSON.parse(form.form.requests);
							
							for (var i = result.requests.length-1; i >= 0; i--) {								
							
								recordsTotal += result.requests[i].status.recordsTotal;
								var requestName = result.requests[i].status.requestName;
								multiCommands.push(requestName)

								if(!reqs[requestName]){
									reqs[requestName] = {total:result.requests[i].status.recordsTotal, count:0, timestamp:result.requests[i].status.requestUnixTime, recordsInResponse:result.requests[i].status.recordsInResponse}
								}

								// save requestname in records for later
								for (var x = 0; result.requests[i].records && x < result.requests[i].records.length; x++) {
									result.requests[i].records[x]._requestName = requestName;
									result.requests[i].records[x]._timestamp = result.requests[i].status.requestUnixTime;
									reqs[requestName].count++

								};
								
								req_result = req_result.concat(result.requests[i].records)
								
								// Delete finished request
								if(reqs[requestName].count === reqs[requestName].total || (reqs[requestName].recordsInResponse === 0 && form.form.requests[i].pageNo > 1)){
									
									if((reqs[requestName].recordsInResponse === 0 && form.form.requests[i].pageNo > 1))
										log(requestName + " ENDED EARLY")
									try{ 
										form.form.requests.splice(i,1)}
									catch(err){ 
										cb(err)
									}
								}

							};

							result = req_result;
						}
						


						// Save Total records in first request
						if(!params._recordsTotal)
							params._recordsTotal = recordsTotal;
						
						
						// Append attributes to main object
						for(var i = 0; i < result.length; i++){
							if(result[i] && result[i].attributes){
								for(var x = 0; x < result[i].attributes.length; x++){
									if(result[i].attributes[x].attributeType === "integer" || result[i].attributes[x].attributeType === "int"){
										result[i].attributes[x].attributeValue = parseInt(result[i].attributes[x].attributeValue);
									} else if(result[i].attributes[x].attributeType === "float"){
										result[i].attributes[x].attributeValue = parseFloat(result[i].attributes[x].attributeValue);
									}

									result[i][result[i].attributes[x].attributeName] = result[i].attributes[x].attributeValue;
								}
								delete result[i].attributes;
							}
							
						}

						// Add to existing records if exists
						records = records ? records.concat(result) : result;
						
						if(isSingleCommand && form.form.pageNo > 1 && status.recordsInResponse === 0){
							console.error("Single command on page: " + form.form.pageNo + " with no more records")
							log("Setting recordsTotal to records.length: " + params._recordsTotal + "/" + records.length, status)
							params._recordsTotal = records.length;
						}

						log("[" + self.REQS_SERVED_THIS_HOUR + "/" + self.REQS_SERVED + "/" + request_id + "/" + (form.form.pageNo ? form.form.pageNo : 1) +"] Records: (" + (multiCommands.length ? multiCommands.join(", ") : command) + ") - " +  records.length + "/" + params._recordsTotal + " (" + recordsTotal + ")")
						
						if(recordsOnPage === 1)
							return cb(null,records, request_id)

//log(records)
						// IF total records are bigger than current records, run next page. Or if there is more in the multi request
						if(params._recordsTotal > records.length || (isMultiCommand && form.form.requests.length)){

							// Multi
							if(form.form.requests){
								
								for (var y = 0; y < form.form.requests.length; y++) {
										
									if(!form.form.requests[y].pageNo)
										form.form.requests[y].pageNo = 2;
									else
										form.form.requests[y].pageNo++;
								};

							} else
								form.form.pageNo++;
							
							form.form.requests = JSON.stringify(form.form.requests);
							
							if(params._recordsTotal <= records.length){
								
								if(params.changedSince){
									var ts = self._getTimestamp(records);
									records = {timestamp:ts, result:records}
								}
								return cb(null,records, request_id);
							}
							else{
								return setTimeout(self.doRequest, self.REQ_QUEUE_DELAY, command, params, form, records, request_id, cb);
							}

						} else{

							// FINAL CALLBACK
							if(params && params.changedSince){
								var ts = self._getTimestamp(records);
								records = {timestamp:ts, result:records}
							}
							
							return cb(null,records, request_id);
						}

					} else{

						// ERROR
						if(result && result.status && result.status.errorCode)
							cb(self.erplyError(result.status.errorCode, result.status), null, request_id);
						else
							cb("Response empty: " + body, null, request_id);

						return;
					}

				} catch(err){
					console.error(err)
					try{

						if(typeof err === "string" && isNetworkError(err))
							cb({ code:'ENOTFOUND', message: "Request to ERPLY failed. Network error: " + err, description:'Check your internet connection!'}, null, request_id)
						else
							cb({message:"ERPLY request error!", description:err}, null, request_id);
					
					}catch(err){
						console.error(err)
					}

				}
			}
		});

		
		req.on("error", function(err){
			if(!cb)
				return;
			if(typeof err == "object" && err.code && isNetworkError(err.code))
				cb({code:err.code, message:"Request to ERPLY failed. Network error: " + err.code, descriptions:'Check your internet connection!'}, request_id)
			else
				cb(err,null,request_id)
		})
		

	return (request_id)
	}

	self.sendMultiRequest = function(items, cb, multi){

		if(!cb) cb = function(e, r){log(r)}

		if(!items || items.length < 1){
			cb("Request is empty!")
			return false;
		}

		var reqs = [];
		var resp = {results:[],total:0}
		var error;
		var total_items = 0;
		var request_id = ++self.REQUEST_ID;
		var command;
		var multi_commands = {}
		var multi_commands_length = 0;
		var isMultiCommand = multi ? true : false;
		var isBatchCommand = items[0].cmd ? true : false;

		for (var i = 0, count = 1; i < items.length; i++, count++){
			if(count>100) {
				request_id = ++self.REQUEST_ID; 
				count=1;
			}

			items[i].request_id = request_id;
			command = items[i].requestName;

			if(!multi_commands[command])
				multi_commands[items[i].requestName] = {result:[], timestamp:0}

			if(Object.keys(multi_commands).length>1)
				isMultiCommand = true;

		}

		multi_command_length = Object.keys(multi_commands).length;

		if(items.length>100){
			for (var i = 0; i < items.length; i += 100) {

				if((i+100) < items.length)
					reqs.push( items.slice(i, (i+100)) );
				else
					reqs.push( items.slice(i) );

				total_items += reqs[reqs.length-1].length
			}
		}else{
			reqs.push(items);
			total_items = items.length;
		}
		
		if(!isMultiCommand)
			log("[" + self.REQS_SERVED_THIS_HOUR + "/" + self.REQS_SERVED + "/" + request_id + "] " + "Sending MULTI REQ ("+ command + "): " + total_items);
		else
			log("[" + self.REQS_SERVED_THIS_HOUR + "/" + self.REQS_SERVED + "/" + request_id + "] " + "Sending MULTI COMMAND REQ ("+ Object.keys(multi_commands).join(",") + "): " + total_items);

		for(var i = 0, done = 0; i < reqs.length;i++){
			
			var rid = self.sendRequest("multi", reqs[i], function(err, r){
				
				if(err){
					error = true;
					self._clearQueue(request_id);
					cb(err)
					return;
				}
				
				done++;

				//log(r)
				
				if(!isMultiCommand)
					resp.results = resp.results.concat(r);
				
				if(r && r.length)
					resp.total += r.length;

				//self.emit("progress", {rec:resp.total, max:total_items, request_id:request_id })
				//log(isMultiCommand + " " +  resp.results.length + " - " + items.length + " - " + resp.total)

				//if(resp.results.length >= resp.total){
				if((resp.results.length >= items.length && !isMultiCommand) || isMultiCommand){
						
					if(isMultiCommand){
							
						for (var x = 0; r && x < r.length; x++) {

							if(r[x] && multi_commands[r[x]._requestName]){

								multi_commands[r[x]._requestName].result.push(r[x])

								if(multi_commands[r[x]._requestName].timestamp === 0)
									multi_commands[r[x]._requestName].timestamp = r[x]._timestamp;
								else if(multi_commands[r[x]._requestName].timestamp < r[x]._timestamp)
									multi_commands[r[x]._requestName].timestamp = r[x]._timestamp;
							}

						}
						
						resp.results = multi_commands;

						if(isBatchCommand && done < reqs.length)
							return;
					}
										
					if(isMultiCommand)
						return cb(null, multi_commands)

					cb(err, resp ? resp.results : [])
				
					if(!isMultiCommand)
						log("[DONE] MULTI REQ ("+ command +"): " + resp.results.length + " " + total_items)
					else
						log("[DONE] MULTI COMMAND REQ ("+ Object.keys(multi_commands).join(",") + "): " + total_items);
				}
			})
		}

	return(request_id)
	}
	self.sendMultiRequest2 = function(items, cb, multi){

		if(!cb) cb = function(e, r){log(r)}

		if(!items || items.length < 1){
			cb("Request is empty!")
			return false;
		}

		var reqs = [];
		var resp = {results:[],total:0}
		var error;
		var total_items = 0;
		var request_id = ++self.REQUEST_ID;
		var command;
		var multi_commands = {}
		var isMultiCommand = multi ? true : false;

		for (var i = 0, count = 1; i < items.length; i++, count++){
			if(count>100) {request_id = ++self.REQUEST_ID; count=1;}
			items[i].request_id = request_id;

			command = items[i].requestName;

			if(!multi_commands[command])
				multi_commands[items[i].requestName] = {result:[], timestamp:0}

			if(Object.keys(multi_commands).length>1)
				isMultiCommand = true;

		}

		if(items.length>100){
			for (var i = 0; i < items.length; i += 100) {

				if((i+100) < items.length)
					reqs.push( items.slice(i, (i+100)) );
				else
					reqs.push( items.slice(i) );

				total_items += reqs[reqs.length-1].length
			}
		}else{
			reqs.push(items);
			total_items = items.length;
		}
		if(!isMultiCommand)
			log("[" + self.REQS_SERVED + "] " + "Sending MULTI REQ ("+ command + "): " + total_items);
		else
			log("[" + self.REQS_SERVED + "] " + "Sending MULTI COMMAND REQ ("+ Object.keys(multi_commands).join(",") + "): " + total_items);
		
		var funcs = [];


		for(var i = 0; i < reqs.length;i++)
			funcs.push(function(c){
				sendMulti(this, c);
			}.bind(reqs[i]))
		
		async.series(funcs, function(err, result){
			cb(err,result)
		})

		function sendMulti(request, callback){

			self.sendRequest("multi", request, function(err, r){
				
				if(err){
					error = true;
					self._clearQueue(request_id);
					callback(err)
					return;
				}
				
				resp.results = resp.results.concat(r);

				if(r && r.length)
					resp.total += r.length;

				self.emit("progress", {rec:resp.total, max:total_items, request_id:request_id })
				
				if((resp.results.length === items.length && !isMultiCommand) || isMultiCommand){
					
					try{
						
						if(isMultiCommand){
							
							for (var x = 0; x < resp.results.length; x++) {
								if(multi_commands[resp.results[x]._requestName]){

									multi_commands[resp.results[x]._requestName].result.push(resp.results[x])

									if(multi_commands[resp.results[x]._requestName].timestamp === 0)
										multi_commands[resp.results[x]._requestName].timestamp = resp.results[x]._timestamp;
									else if(multi_commands[resp.results[x]._requestName].timestamp < resp.results[x]._timestamp)
										multi_commands[resp.results[x]._requestName].timestamp = resp.results[x]._timestamp;
								}

							}
							resp.results = multi_commands;
						}
						if(!resp)
							callback(err, [])
						else
							callback(err, resp.results);

					}catch(err){callback(err)}

					if(!isMultiCommand)
						log("[DONE] MULTI REQ ("+ command +"): " + resp.results.length + " " + total_items)
					else
						log("[DONE] MULTI COMMAND REQ ("+ Object.keys(multi_commands).join(",") + "): " + total_items);
				}
			})
		}
	
	}
	self.shutDown = function(cb, attempts){

		if(!self.INIT_DONE)
			return cb();

		attempts = (attempts || 0);

		if((!self.REQ_QUEUE_RUNNING && self.INIT_DONE) || attempts > 5){
			log("Closed ERPLY")
			self.CLOSED_DOWN = true;
			cb();
		}
		else{
			setTimeout(self.shutDown, 1000, cb, ++attempts);
		}
	}

	self._checkRequestQueue = function(){

		if(self.REQ_QUEUE.length>0){

			clearTimeout(self.REQ_QUEUE_TIMEOUT);
			self.REQ_QUEUE_RUNNING = true;

			var req_obj = self.REQ_QUEUE[0];

			var command = req_obj.command;
			var params = req_obj.params;
			var cb = req_obj.cb;
			var records = req_obj.records;
			var request_id = req_obj.request_id;

			self.sendRequest(command,params,cb,true, records, request_id);

			if(self.REQ_QUEUE.length>0)
				self.REQ_QUEUE_TIMEOUT = setTimeout(self._checkRequestQueue,self.REQ_QUEUE_DELAY);

			self._clearQueue(request_id);
		}
		else{

			self.REQ_QUEUE_RUNNING = false;
		}
	}

	self._clearQueue = function(request_id){

		if(!request_id){
			self.REQ_QUEUE = [];
			return(true)
		}
		else{
			for(var i = 0; i < self.REQ_QUEUE.length; i++){
				if(self.REQ_QUEUE[i].request_id === request_id){
					self.REQ_QUEUE.splice(i,1);
					return(true)
				}

			}

		}

	return(false)
	}

	self._getSessionKey = function(cb, org_cb){

		if(!cb) cb = function(){};
		if(!org_cb) org_cb = function(){};

		if(self.SESSION_KEY) self.SESSION_KEY = null;

		return self.sendRequest("verifyUser", {username:self.USERNAME, password:self.PASSWORD}, function(err, resp){
			
			if(!err && !resp.length)
				err = "Wrong username or password at login"

			if(!err){

				var exp = new Date();

				exp.setSeconds(exp.getSeconds() + resp[0].sessionLength-10);
				self.SESSION_KEY = {key:resp[0].sessionKey, expires:exp};
				log("ERPLY SESSION KEY: " + self.SESSION_KEY.key + " / " + self.SESSION_KEY.expires.toString())
				
				setTimeout(function(){
					cb(null, self.SESSION_KEY, org_cb);	
				},500)
				
				// self._refreshSessionKey(50);
				// Update session key to worker
				
				
			} else{

				cb(err, null, org_cb);
			}

		});
	}

	self._refreshSessionKey = function(sec){

		clearTimeout(self._SESSION_KEY_CHECK);

		self._SESSION_KEY_CHECK = setTimeout(self._getSessionKey, (sec*60000), function(err){
			if(err)
				self._SESSION_KEY_CHECK = setTimeout(self._refreshSessionKey, 60000);
		});
	}

	self._getLastEANCode2 = function(cb){

		if(!cb) cb = function(e, r){log(r)}

		//return self.sendRequest("getProducts", {orderBy:"added", recordsOnPage:1, orderByDir:"desc",searchAttributeName:"warehouseID", searchAttributeValue:self.WAREHOUSE_ID}, function(err, resp){	
		return self.sendRequest("getProducts", {orderBy:"productID", recordsOnPage:1, orderByDir:"desc"}, function(err, resp){

			if(err) return cb(err)

			if(resp && resp.length > 0 && resp[0].code2){
				
				if(self.EAN_CODE < (self.EAN_START_CODE + parseInt(resp[0].productID) ))
					self.EAN_CODE = parseInt(resp[0].code2);
			}
			else
				self.EAN_CODE = self.EAN_START_CODE;

			cb(null, self.EAN_CODE);
		});
	}
	self._getLastEANCode = function(cb){

		if(!cb) cb = function(e, r){log(r)}

		//return self.sendRequest("getProducts", {orderBy:"added", recordsOnPage:1, orderByDir:"desc",searchAttributeName:"warehouseID", searchAttributeValue:self.WAREHOUSE_ID}, function(err, resp){	
		return self.sendRequest("getProducts", {orderBy:"productID", recordsOnPage:1, orderByDir:"desc"}, function(err, resp){

			if(err) return cb(err)

			if(resp && resp.length > 0 && resp[0].productID){
				var ean = (self.EAN_START_CODE + resp[0].productID+1000000)+1;
				if(self.EAN_CODE < ean)
					self.EAN_CODE = ean
			}
			else
				self.EAN_CODE = self.EAN_START_CODE+1000000;

			cb(null, self.EAN_CODE);
		});
	}
	self.checkForUpdates = function(since, cb){
		
		return self.sendRequest("getChangedDataSince", {changedSince:since}, function(err, upd){
			console.table(upd.result)
			if(err || !upd) return cb(err)
			
			upd = upd.result;

			var updates = false;

			for (var i = 0; i < upd.length; i++) {
				if(upd[i].updated || upd[i].deleted){
					updates = true;
					break;
				}
			}

			cb(err,updates)

		});		
	}

	self.getPointsOfSale = function(cb){

		return self.sendRequest("getPointsOfSale", {warehouseID:self.WAREHOUSE_ID}, cb);

	}

	self.getWarehouses = function(cb){

		return self.sendRequest("getWarehouses", {}, cb);

	}

	self.getConfParameters = function(cb){

		return self.sendRequest("getConfParameters", {}, cb);

	}

	self.loadAll = function(cb){

		async.parallel([

		self.getAllProductCategories,
		self.getAllBrands,
		self.getAllCustomers],

		function(err, result){

			var data = {};

			if(result[0])
				data.categories = result[0];
			if(result[1])
				data.brands = result[1];
			if(result[2])
				data.customers = result[2];

			cb(err, data);

		});

	}

	self.loadAllSince = function(date, cb){

		if(!cb) cb = function(e,r){log(e); log(r);}
		
	
			var funcs = [];
			funcs.push({cmd:"getSalesDocuments", changedSince:date, getRowsForAllInvoices:1, recordsOnPage:100});
			funcs.push({cmd:"getPayments", changedSince:date, recordsOnPage:100});
			funcs.push({cmd:"getProducts", changedSince:date, recordsOnPage:1000});
			funcs.push({cmd:"getCustomers", changedSince:date, getBalanceInfo:1, recordsOnPage:100});
			funcs.push({cmd:"getCashIns", changedSince:date, recordsOnPage:100});			

			var query = self.generateMultiReq(null,funcs);

			self.sendMultiRequest(query, function(err,result){

				if(err){
					cb(err);
					return;
				}

				var data = {};
				data.customers = result.getCustomers;
				data.payments = result.getPayments;
				data.products = result.getProducts;
				data.sales = result.getSalesDocuments;
				data.cashio = result.getCashIns;
				
				cb(err, data);

			})
	}
	self._loadAllSince = function(date, cb){

		if(!cb) cb = function(e,r){log(e); log(r);}
		
			var funcs = [];
			funcs.push({cmd:"getSalesDocuments", changedSince:date, getRowsForAllInvoices:1, recordsOnPage:10});
			funcs.push({cmd:"getPayments", changedSince:date, recordsOnPage:2});
			funcs.push({cmd:"getProducts", changedSince:date, recordsOnPage:10});
			funcs.push({cmd:"getCustomers", changedSince:date, getBalanceInfo:1, recordsOnPage:2});
			funcs.push({cmd:"getCashIns", changedSince:date, recordsOnPage:10});
			var query = self.generateMultiReq(null,funcs);

			self.sendMultiRequest(query, function(err,result){

				if(err){
					cb(err);
					return;
				}

				var data = {};
				data.customers = result.getCustomers;
				data.payments = result.getPayments;
				data.products = result.getProducts;
				data.sales = result.getSalesDocuments;
				data.cashio = result.getCashIns;

				cb(err, data);

			})
	}
	self.getPrices = function(cb){

		var max = 300;
		var p = [];

		p.push({price:1, priceID:1});
		p.push({price:2, priceID:2});
		p.push({price:3, priceID:3});
		p.push({price:5, priceID:4});
		p.push({price:7, priceID:5});
		p.push({price:10, priceID:6});
		p.push({price:12, priceID:7});
		p.push({price:15, priceID:8});
		p.push({price:20, priceID:9});

		for(var price = p[p.length-1].price+5, id = p[p.length-1].priceID+1; price <= max;id++, price+=5)
			p.push({price:price, priceID:id})
		
		if(cb)
			cb(null, p);

		return(p)
	}

	self.getProduct = function(product_id, cb){

		var query = {};

		if(Array.isArray(product_id)){

			query = self.generateMultiReq("getProducts", product_id);
			return self.sendMultiRequest(query, cb);

		}

		if(product_id)
			query.productID = product_id;

		return self.sendRequest("getProducts", query, function(err, resp){

			if(cb)
				cb(err, resp)

		});

	}
	self.getProducts = function(product_ids, cb){

		var query = {};
		query.productIDs = product_ids.join(',');
		query.recordsOnPage = 1000

		return self.sendRequest("getProducts", query, function(err, resp){
			if(cb)
				cb(err, resp)
		});
	}
	self.getBuyinProducts = function(buyin_id, cb){

		return self.sendRequest("getProducts", {searchAttributeName:"buyinID2", searchAttributeValue:buyin_id, active:1, addedSince:Math.round(new Date(config.system_start_date).getTime()/1000)}, function(err, resp){

			if(cb){
				
				if(resp && resp.length){
					
					for (var i = resp.length-1; i >= 0; i--) {
						if(parseInt(resp[i].warehouseID) !== self.WAREHOUSE_ID)
							resp.splice(i,1);
					};
					
				}
				
				cb(err, resp)
			}

		});

	}

	self.deleteProduct = function(prod_id, cb){

		if(!cb) cb = function(e,r){log(e); log(r);}

		var cmd = "saveProduct";
		var query;

		if(Array.isArray(prod_id)){

			for(i in prod_id)
				prod_id[i] = {productID:prod_id[i].productID, status:"ARCHIVED"};

			query = self.generateMultiReq(cmd, prod_id);
			return self.sendMultiRequest(query, cb);

		}

		return self.sendRequest(cmd, {productID:prod_id, active:0}, function(err, product_group){

			if(cb)
				cb(err, product_group);

		});

	}
	self.deleteBuyinProducts = function(products, cb){

		if(!cb) cb = function(e,r){log(e); log(r);}

		if(!products || !products.length)
			return cb("No products to delete!")

		var cmd = "saveProduct";
		var query;

			for(i in products){
				products[i] = {
					productID:products[i].productID, 
					status:"ARCHIVED",
					groupID:products[i].groupID,
					attributeName1:"buyinID",
					attributeType1:"integer",
					attributeValue1:null,
					attributeName2:"buyinID2",
					attributeType2:"text",
					attributeValue2:null
				};
			}

		query = self.generateMultiReq(cmd, products);
		return self.sendMultiRequest(query, cb);
		
	}
	self.saveProduct = function(name, prod, cb, simple){

		if(typeof prod === "function") {
			simple = cb; 
			cb = prod; 
		}
		
		var cmd = "saveProduct";
		var query;
		
		if(Array.isArray(name)){
			
			query = self.generateMultiReq(cmd, name, null, self.EAN_CODE);
			
			return self.sendMultiRequest(query, function(err, products){

				if(err || (products && products.error))
					return cb(err);
				
				if(simple)
					return cb(null, products);

				self.getProduct(products, function(err, prods){

					if(err || (prods && prods.error))
						return cb(err);
					else
						cb(null, prods);

				});

			})

		}else{

			query = {name:name.name}

			if(name.productID)
				query.productID = name.productID;
			if(name.brandID)
				query.brandID = name.brandID;
			if(name.categoryID)
				query.categoryID = name.categoryID;
			if(name.price)
				query.priceWithVAT = name.price;
			if(name.priceWithVAT)
				query.priceWithVAT = name.priceWithVAT;
			if(name.groupID)
				query.groupID = name.groupID;
			if(name.isGiftCard)
				query.isGiftCard = name.isGiftCard;
			if(name.employeeIDs)
				query.employeeIDs = name.employeeIDs;
			if(name.description !== undefined){
				query.description = name.description;
				query.descriptionENG = name.description;
			}
				
			if(!name.code2)
				query.code2 = (++self.EAN_CODE);
			else
				query.code2 = name.code2;

			if(!name.productID){
				query.active = 1;
				query.status = "ACTIVE";
			}

			if(name.productGroupCode && !query.code)
				query.code = self.WAREHOUSE_ID + "-" + (query.code2-self.EAN_START_CODE) + "-" + name.productGroupCode;

		}

		return self.sendRequest(cmd, query, function(err, products){

			if(!err){
				if(simple)
					return cb(null, products)
				self.getProduct(products, cb)
			}
			else
				cb(err)

		});
	}
	self._saveProduct = function(name, prod, cb, simple){

		if(typeof prod === "function") {
			simple = cb; 
			cb = prod; 
		}
		
		var cmd = "saveProduct";
		var query;

		self._getLastEANCode(function(err, ean_code){
		

			if(!err){
				

				if(Array.isArray(name)){
					
					query = self.generateMultiReq(cmd, name, null, ean_code);
					
					return self.sendMultiRequest(query, function(err, products){

						if(err || (products && products.error))
							return cb(err);
						
						if(simple)
							return cb(null, products);

						self.getProduct(products, function(err, prods){

							if(err || (prods && prods.error))
								return cb(err);
							else
								cb(null, prods);

						});

					})

				}else{

					query = {name:name.name}

					if(name.productID)
						query.productID = name.productID;
					if(name.brandID)
						query.brandID = name.brandID;
					if(name.categoryID)
						query.categoryID = name.categoryID;
					if(name.price)
						query.priceWithVAT = name.price;
					if(name.priceWithVAT)
						query.priceWithVAT = name.priceWithVAT;
					if(name.groupID)
						query.groupID = name.groupID;
					if(name.description){
						query.description = name.description;
						query.descriptionENG = name.description;
					}
					if(!name.code2)
						query.code2 = (++self.EAN_CODE);
					else
						query.code2 = name.code2;

					if(!name.productID){
						query.active = 1;
						query.status = "ACTIVE";
					}

					if(name.productGroupCode && !query.code)
						query.code = self.WAREHOUSE_ID + "-" + (name.code2-self.EAN_START_CODE) + "-" + name.productGroupCode;

				}

				return self.sendRequest(cmd, query, function(err, products){

					if(!err){
						if(simple)
							return cb(null, products)
						self.getProduct(products, cb)
					}
					else
						cb(err)

				});

			}else
				cb(err);
		})


	}
	self.getEmployees = function(cb){

		return self.sendRequest("getEmployees", {}, cb)

	}

	self.getEmployeeById = function(id){

		id = parseInt(id);

		if(self.ERPLY_EMPLOYEES){
			for(var x = 0; x < self.ERPLY_EMPLOYEES.length;x++){
				if(self.ERPLY_EMPLOYEES[x].id === id)
					return(self.ERPLY_EMPLOYEES[x])
			}
		}

	return false;
	}

	self.getActiveEmployees = function(){
		var emps = self.ERPLY_EMPLOYEES.filter(function(o){
			return (parseInt(o.userGroupID) !== self.USER_GROUP_ARCHIVED && o.username && o.username.toLowerCase().indexOf("chinemachine") === -1 && o.username.toLowerCase().indexOf("cmachine") === -1);
		})

		return emps;
	}
	self.saveEmployee = function(employee, cb){
		
		var errors = self.validateEmployee(employee)

		if(errors)
			return cb(errors.join(' '))

		if(!employee)
			return cb('No employee to save. Please try again.')

		self.getEmployees(function(err, users){

			if(err) return cb(err)
			

			for (var i = 0; users.length !== 0 && i < users.length; i++){
				if(users[i].username && users[i].username.toLowerCase() === employee.username.toLowerCase())
					return cb("Username \"" + employee.username + "\" has already been used!")
			}
			
			self.sendRequest("saveEmployee", employee, function(err, emp){

				if(err) return cb(err)
				if(!employee) return cb('No employee to save! Try it again maybe')
				emp = emp[0];

				var e = {userGroupID:employee.userGroupID, name:employee.username, password:employee.password};
				var user  = {name:employee.username, password:employee.password, employeeID:emp.employeeID, userUseForApiIntegration:1, userGroupID:employee.userGroupID} 

				self.sendRequest("saveUser", user, function(err, new_user){

					if(err) return cb(err)

					var userID = new_user && new_user.length ? new_user[0].userID : null;
					if(!userID)
						return cb("Can't create user account for " + employee.username)

					var u = {username:employee.username, password:employee.password, firstName:employee.firstName, lastName:employee.lastName, name:employee.username, userID:userID, employeeID:parseInt(emp.employeeID), userGroupID:userGroupID}	 

					self.getEmployees(function(err, emps){
						if(err)
							return cb(err)
						
						self.ERPLY_EMPLOYEES = emps;
						cb(null, u)
					})					
				})

			})

		})
	}
	self.updateEmployee = function(employee, cb){

		if(employee.payRate){
			employee.attributeName1 = "payRate"
			employee.attributeType1 = "float"
			employee.attributeValue1 = parseFloat(employee.payRate);		
			delete employee.payRate;
		}

		self.sendRequest("saveEmployee", employee, cb);
	}
	self.updateUser = function(usr, cb){
		
		if(isNaN(usr.userID))
			delete usr.userID;
		self.sendRequest("saveUser", usr, cb)
	}

	self.saveUser = function(username, password, cb){


	}
	self.archiveEmployee = function(userID , employeeID, cb){
		

		if(!userID){
			self.getEmployees(function(err, emps){
				if(!err) self.ERPLY_EMPLOYEES = emps;
				cb()
			})
		return;
		}


		self.sendRequest("saveUser", {userID:userID, employeeID:employeeID, userGroupID:self.USER_GROUP_ARCHIVED}, function(err, emp){

				if(err) return cb(err)

				self.getEmployees(function(err, emps){
					if(!err) self.ERPLY_EMPLOYEES = emps;
					cb()
				})
		})

	}
	self.validateEmployee = function(emp, exclude){

        var errors = []

        if(!emp || !(typeof emp === 'object'))
            return ['Employee not valid']
        if(!emp.firstName || emp.firstName.length<2)
            errors.push("First name not valid. Must be at least 2 characters long")
        if(!emp.lastName || emp.lastName.length<2)
            errors.push("Last name not valid. Must be at least 2 characters long.")
        if(!emp.username){
            errors.push("Username is empty!")
        }else{

            if(emp.username.length < 3)
                errors.push('Username is too short. Must be at least 3 characters long.')
            else if(emp.username.match(/[^A-Za-z0-9]/g))
                errors.push("Username can't have special characters or spaces.")
        }

        if(typeof emp.password !== "undefined"){
	        if(emp.password !== emp.password2)
	        	errors.push("Password doesn't match re-typed password")
            else if(emp.password.match(/[^A-Za-z0-9]/g))
                errors.push("Password can't contain special characters. Password must be at least eight characters long including one uppercase letter, one alphanumeric characters.")
            else if(!emp.password.match(/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/))
                errors.push("Password not valid. Must be at least eight characters long including one uppercase letter, one alphanumeric characters.")
	    }
	    if(!self.USER_GROUPS.includes(emp.userGroupID))
	    	errors.push("User doesn't belongs to any user group")
        if(emp.email && !validator.isEmail(emp.email))
            errors.push("E-Mail " + emp.email + " not valid!")
        
        return errors.length ? errors : null;
	}
	self.saveCashOut = function(amount, comment, buyinID, obj, cb){

		var query = {
			pointOfSaleID:self.ERPLY_REGISTERS[0].pointOfSaleID,
			sum:amount,
			comment:comment,
			warehouseID:self.WAREHOUSE_ID,
			attributeName1:"buyinID",
			attributeType1:"integer",
			attributeValue1:buyinID,
			attributeName2:"buyinObj",
			attributeType2:"text",
			attributeValue2:JSON.stringify(obj),
			attributeName3:"buyinID2",
			attributeType3:"text",
			attributeValue3:self.WAREHOUSE_ID + "-" + buyinID
		}
		if(obj.transactionID)
			query.transactionID = obj.transactionID;

		return self.sendRequest("POSCashOUT", query, cb);

	}


	self.deleteCashOut = function(transaction_id, posID, cb){

		if(!cb) cb = function(e, r){log(e); log(r)}
		
		return self.sendRequest("POSCashOUT", {
			pointOfSaleID:posID,
			sum:0,
			comment:"CANCELLED",
			transactionID:transaction_id
		}, cb);

	}
	self.changeCashOut = function(transaction_id, sum, posID, obj, cb){

		if(!cb) cb = function(e, r){log(e); log(r)}
		log(posID)
		return self.sendRequest("POSCashOUT", {
			pointOfSaleID:posID,
			sum:sum,
			transactionID:transaction_id,
			attributeName1:"buyinID",
			attributeType1:"integer",
			attributeValue1:obj.buyinID,
			attributeName2:"buyinObj",
			attributeType2:"text",
			attributeValue2:JSON.stringify(obj),
			attributeName3:"buyinID2",
			attributeType3:"text",
			attributeValue3:obj.buyinID2
		}, cb);

	}
	self.savePayout = function(date, options, clockin, cb){

		var query = {
			pointOfSaleID:self.ERPLY_REGISTERS[0].pointOfSaleID,
			sum:options.amount,
			comment: options.amount ? "PAYOUT" : "CANCELLED",
			warehouseID:self.WAREHOUSE_ID,
			attributeName1:"employeeID",
			attributeType1:"integer",
			attributeValue1:options.employeeID,
			attributeName2:"payout",
			attributeType2:"integer",
			attributeValue2:1,
			attributeName3:"timeclockRecordID",
			attributeType3:"integer",
			attributeValue3:options.timeclockRecordID || null,
			attributeName4:"notes",
			attributeType4:"text",
			attributeValue4:options.notes ? options.notes : null,
			attributeName5:"clockin",
			attributeType5:"text",
			attributeValue5:JSON.stringify(clockin)
		}

		if(options.transactionID)
			query.transactionID = options.transactionID;
		
		
		return self.sendRequest("POSCashOUT", query, cb);
		
	}
	self.deletePayout = function(transactionID, posID, cb){

		return self.sendRequest("POSCashOUT", {
			pointOfSaleID:posID,
			sum:0,
			comment:"CANCELLED",
			transactionID:transactionID,
			attributeName1:"employeeID",
			attributeType1:"integer",
			attributeValue1:null,
			attributeName2:"payout",
			attributeType2:"integer",
			attributeValue2:null,
			attributeName3:"timeclockRecordID",
			attributeType3:"integer",
			attributeValue3:null,
			attributeName4:"payoutAmount",
			attributeType4:"integer",
			attributeValue4:null
		}, cb);
	}
	self.getSales = function(date, warehouseID, cb){
		
		var funcs = [];
		funcs.push(function(callback){self.getSalesDocuments(date, date, warehouseID, callback);})
		async.parallel(funcs, function(err,result){
			
			var transactions;

			if(!err && result && result.length){

				var sales_docs = result[0]

				if(!sales_docs.length){
					cb(null)
					return;
				}

				var ids = [];
				for (var i = 0; i < sales_docs.length; i++) {
					ids.push(sales_docs[i].id)
				};
				
				self.getPaymentsByIDs(ids, function(err, payments){
					if(!payments.length){
						cb(null)
						return;
					}

					var dayTotalCash = 0;
					var dayTotalCard = 0;
					var dayTotalCredit = 0;
					var dayTotalBuyins = 0;
					var dayTotalWarehouse = 0;
					var dayTotalOther = 0;
					var dayTotalItems = 0;

					for(var x = 0; x < sales_docs.length; x++){
						sales_docs[x].payments = [];
						for(var i = 0; i < payments.length; i++){
							if(payments[i].documentID === sales_docs[x].id)
								sales_docs[x].payments.push(payments[i])
						}

					}

					for(var i = sales_docs.length-1; i >=0;i--){

	                	dayTotalItems += sales_docs[i].rows.length;

	                	var transaction = {};
	                	var products = [];
	                	var card = 0;
	                	var cash = 0;
	                	var credit = 0;
	                	var discount = 0;
	                	var time = sales_docs[i].time

	                	for(var x = 0; x < sales_docs[i].rows.length;x++){

	                		products.push({
	                			productID:parseInt(sales_docs[i].rows[x].productID),
	                			code:sales_docs[i].rows[x].code,
	                			price:sales_docs[i].rows[x].finalPriceWithVAT,
	                			name:sales_docs[i].rows[x].itemName,
	                			discount:parseFloat(sales_docs[i].rows[x].discount)
	                		})
	                		
	                		if(products[products.length-1].code.indexOf(self.BI_GROUP.productGroupCode) > -1)
	                			dayTotalBuyins += products[products.length-1].price
	                		else if(products[products.length-1].code.indexOf(self.WH_GROUP.productGroupCode) > -1)
	                			dayTotalWarehouse += products[products.length-1].price
	                		else
	                			dayTotalOther += products[products.length-1].price
							
	                		if(!discount){
	                			discount = Math.floor(parseFloat(sales_docs[i].rows[x].discount));
	                		}

	                	}

	                	var payment = {paymentIDs:[]}

	                	if(sales_docs[i].payments){

	                		for(var q = 0; q < sales_docs[i].payments.length;q++){
	                			if(sales_docs[i].payments[q].type === "CARD")
	                				card += parseFloat(sales_docs[i].payments[q].sum)
	                			else if(sales_docs[i].payments[q].type === "CASH")
	                				cash += parseFloat(sales_docs[i].payments[q].sum)
	                			else if(sales_docs[i].payments[q].type === "CREDIT")
	                				credit += parseFloat(sales_docs[i].payments[q].sum)

	                			payment.card = card;
	                			payment.cash = cash;
	                			payment.credit = credit;
	                			payment.paymentIDs.push(sales_docs[i].payments[q].paymentID)

	                			if(sales_docs[i].payments[q].customerID)
	                				payment.customerID = sales_docs[i].payments[q].customerID

	                			payment.documentID = sales_docs[i].payments[q].documentID;
	                		}

	                		if(isNaN(payment.credit))
	                			payment.credit = 0;
	                	}
	                	/*
	                    if(!sales_docs[i].paymentType && sales_docs[i].amountPaidWithStoreCredit)
	                    	payment.credit = parseFloat(sales_docs[i].amountPaidWithStoreCredit)
	              		else
	              			payment.credit = 0;

						*/
						transaction.notes = sales_docs[i].internalNotes || sales_docs[i].notes;
	                    transaction.products = products;
	                    transaction.payments = payment;
	                    transaction.credit = payment.credit;
	                    transaction.cash = payment.cash;
	                    transaction.card = payment.card;
	                    transaction.total = card + cash;
	                    transaction.totalWithCredit = card + cash + payment.credit;
	                    transaction.discount = discount;
	                    transaction.time = sales_docs[i].time;
	                    transaction.date = sales_docs[i].date
	                    transaction.documentID = sales_docs[i].id;
	                    transaction.customer = {customerID:sales_docs[i].clientID, name:sales_docs[i].clientName}

	                    dayTotalCash += cash;
	                    dayTotalCard += card;
	                    dayTotalCredit += payment.credit;
	                    sales_docs[i] = transaction;

		            }

		            var sales = {};
					sales.transactions 			= sales_docs;
					sales.dayTotal 				= dayTotalCash + dayTotalCard;
					sales.dayTotalCard 			= dayTotalCard;
					sales.dayTotalCash 			= dayTotalCash;
					sales.dayTotalCredit 		= dayTotalCredit;
					sales.dayTotalItems 		= dayTotalItems;
					sales.dayTotalBuyins 		= dayTotalBuyins;
					sales.dayTotalWarehouse 	= dayTotalWarehouse;
					sales.dayTotalOther 		= dayTotalOther;
					sales.warehouseID 			= self.WAREHOUSE_ID;
					cb(err,sales)
				});

			} else
				cb(null)
		});

	}

	self.saveTransaction = function(trans, cb){


	}

	self.deletePayment = function(id, cb){

		var query = {paymentID:id}
		self.sendRequest("deletePayment", query, cb);
	}

	self.getAllBrands = function(cb){


		return self.sendRequest("getBrands", {}, function(err, brands){

			if(!err && brands)
				self.ERPLY_BRANDS = brands;
			if(cb)
				cb(err, self.ERPLY_BRANDS);
		});

	}

	self.getCustomer = function(customer_id, cb){
		
		return self.sendRequest("getCustomers", {customerID:customer_id, getBalanceInfo:1}, function(err, customer){
			
			if(!err){
				cb(null, customer[0]);
			}
			else{
				cb(err);
			}
		});

	}
	self.getCustomerBuyins = function(customerID, cb){
			
		self.sendRequest("getObjects", {group:"buyin", searchAttributeName1:"customerID", searchAttributeValue1:customerID, partnerKey:self.CLIENT_CODE, recordsOnPage:100}, function(err, r){

			if(err) return cb(err)

			if(!r.length)
				return cb("No customer found with ID: " + customerID)

			cb(null, r)

		})
		
	}
	self.getCustomerManualBalance = function(customerID, cb){
			
			self.sendRequest("getObjects", {
				group:"customer_balance", 
				searchAttributeName1:"customerID", 
				searchAttributeValue1:customerID, 
				recordsOnPage:100,
				partnerKey:self.CLIENT_CODE
			}, function(err, r){

				if(err) return cb(err)
					log(r)
				if(!r.length)
					return cb(null, [])

				cb(null, r)

			})

	}
	self.getAllCustomers = function(cb){

		return self.sendRequest("getCustomers", {getBalanceInfo:1}, function(err, customers){

			if(!err){
				for(i in customers){
					if(customers[i].isPOSDefaultCustomer){
						customers.splice(i, 1);
						break;
					}
				}

				cb(null, customers);

			}
			else
				cb(err);
		});
	}
	self.getAllCustomersSince = function(date, cb){

		return self.sendRequest("getCustomers", {changedSince:date, getBalanceInfo:1}, function(err, customers){

			if(!err){
				customers = customers.result;
				for(i in customers){
					if(customers[i].isPOSDefaultCustomer){
						customers.splice(i, 1);
						break;
					}
				}

				cb(null, customers);

			}
			else
				cb(err);
		});
	}
	self.updateCustomerBalance = function(customer_id, balance, employeeID, cb){

		self.getCustomer(customer_id, function(err, c){

			if(err) return cb(err)
				
			if(c){
				
				var credit = 0;
				var debit = 0;

				if(balance > c.credit)
					credit = balance - c.credit;
				else if( balance < c.credit)
					debit = c.credit - balance;

				if(!credit && !debit) return cb();

				var b_obj = {customerID:customer_id, credit:credit, debit:debit, date:new Date().toString(), employeeID:employeeID}

				log("Customer - Manual credit change from " + c.credit + "EUR to " + balance + "EUR")

				self.saveObject(b_obj, "customer_balance", cb);
			}else
				return cb("Customer not found");

		})

	}
	self.addManualCustomerCredit = function(customerID, amount, date, employeeID, cb){

		var b_obj = {
			customerID:customerID, 
			credit:(amount > 0 ? amount : 0), 
			debit:(amount < 0 ? Math.abs(amount) : 0), 
			date: (date ? date.toString() : new Date().toString()), 
			employeeID:employeeID
		}

		self.saveObject(b_obj, "customer_balance", function(err, o){
			if(!err)
				log("Customer - Manual credit changed with " + amount + "EUR")

			cb(err,o)
		});
		
	}

	self.getProductsByGroup = function(group_id, cb){

		if(!cb) cb = function(e, r){log(r); log(e);}

		return self.sendRequest("getProducts", {groupID:group_id, recordsOnPage:1000, status:"ACTIVE"}, function(err, products){
			cb(err, products);
		});

	}

	self.deleteProductsByGroup = function(group_id, cb){

		if(!cb) cb = function(e, r){log(r); log(e);}

		return self.getProductsByGroup(group_id, function(err, products){

			if(!err){
				if(products.length > 0)
					self.deleteProduct(products, cb);
				else
					cb(null)
			}else
				cb(err);

		})

	}

	self.getAllProducts = function(cb){

		if(!cb) cb = function(e,r){log(r)}

		return self.sendRequest("getProducts", {recordsOnPage:1000, status:"ACTIVE"}, function(err, products){

			if(!err && cb){
				cb(null, products);
			}
			else if(cb)
				cb(err);
		});

	}
	self.getAllProductsSince = function(changedSince, cb){

		if(!cb) cb = function(e,r){log(r)}

		return self.sendRequest("getProducts", {changedSince:changedSince, recordsOnPage:1000}, function(err, products){

			if(!err && cb){
				products = products.result;
				cb(null, products);
			}
			else if(cb)
				cb(err);
		});

	}

	self.getAllProductGroups = function(cb){


		return self.sendRequest("getProductGroups", {}, function(err, product_groups){

			if(!err){

				product_groups = self._sortByKey(product_groups, "name");

				self.ERPLY_GROUPS = product_groups;
				self.BI_GROUP = self.getBuyinGroup()
				self.WH_GROUP = self.getWarehouseGroup()
				self.NT_GROUP = self.getNoTicketGroup()
				cb(err, product_groups);
			}

		});

	}

	self.getSoldProducts = function(dateFrom, dateTo, group_id, cb){

		return self.sendRequest("getProduct", {groupID:group_id, active:0}, function(err, product_groups){

			if(!err){
				self.ERPLY_GROUPS = product_groups;
				cb(err, product_groups);
			}

		});

	}
	self.getReport = function(date, format, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		if(!date)
			date = new Date();

		if(!format)
			format = 0;

		date = moment(date).format("YYYY-MM-DD");

		return self.sendRequest("getReports", {dateStart:date, dateEnd: date, type:"ZReport", format:format}, function(err, report){

			cb(err, report)

		});
	}

	self.getSalesReport = function(date, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		if(!date)
			date = new Date();

		endDate = "2014-11-10";
		date = moment(date).format("YYYY-MM-DD");


		return self.sendRequest("getSalesReport", {dateStart:date, dateEnd: date, reportType:"SALES_BY_INVOICE"}, function(err, report){

			if(!err && report && report[0].reportLink){

				var req = request.get(report[0].reportLink, function (error, response, body) {

					if(error){
						cb(error);
						return;
					}

					csv(body, {delimiter:";", skip_empty_lines:true, auto_parse:true, columns:true}, function(err, output){
  						cb(err, output)
					});

				});

				req.end();
				req.on("error", cb);

			}else
				cb(err)

		});
	}

	self.getPayments = function(date, cb){
		log(date, cb)
		if(!cb) cb = function(e,r){log(e); log(r)}

		var cmd = "getPayments";
		var query = {};


		//if(Array.isArray(ids))
		//	query.documentIDs = ids.join(",");

		if(!date)
			date = new Date();

		date = moment(date).format("YYYY-MM-DD");
		query.dateFrom = date;
		query.dateTo = date;
		log(cmd, query)
		log(typeof cb)
		return self.sendRequest(cmd, query, function(err,payments){

			//if(payments) payments = self._sortByKey(payments, "added");

			cb(err, payments)

		});

	}
	self.getPaymentsByIDs = function(ids, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		var cmd = "getPayments";
		var query = {documentIDs:ids.join(",")};
		return self.sendRequest(cmd, query, cb)
	}
	self.getSalesDocuments = function(date, dateTo, warehouseID, cb){
		log('ERPLy getsalesdocuments', warehouseID)
		if(!date)
			date = new Date();
		
		log(moment(date).format("YYYY-MM-DD") + ' - ' + moment(dateTo).format("YYYY-MM-DD"))
		return self.sendRequest("getSalesDocuments", {warehouseID, dateFrom:moment(date).format("YYYY-MM-DD"), dateTo: moment(dateTo).format("YYYY-MM-DD"), getRowsForAllInvoices:1}, function(err, sales){
			
			if(sales) sales = self._sortByKey(sales, "id", true)
			cb(err,sales)
		});

	}

	self.getSalesDocument = function(id, cb){

		return self.sendRequest("getSalesDocuments", {id:id}, cb);

	}
	self.saveSalesDocumentDate = function(id, date, cb){
		var q = {id:id, date:date.format("YYYY-MM-DD"), time:date.format("HH:mm:ss")}
		self.sendRequest("saveSalesDocument", q, cb);

	}
	self.deleteSalesDocument = function(doc_id, cb){

		self.sendRequest("saveSalesDocument", {id:doc_id, invoiceState:"CANCELLED"}, cb);
	}
	
	self.getProductStock = function(cb){

		return self.sendRequest("getProductStock", {warehouseID:self.WAREHOUSE_ID, getAmountReserved:1, getLastSoldDate:1, status:"ACTIVE"}, function(err, stock){

			if(cb)
				cb(err, stock);

		});

	}

	self.markSoldProducts = function(cb){

		self.getProductStock(function(err, result){

			if(!err){
				if(result.length){
					
					var cmd = "saveProduct";
					var query;

					for(var i = 0; i < result.length;i++){

						result[i] = {productID:result[i].productID, status:"ARCHIVED"};
						result[i].attributeName1 = "dateSold";
						result[i].attributeValue1 = (Math.round(new Date().getTime()/1000));
						result[i].attributeType1 = "integer";

					}

					query = self.generateMultiReq(cmd, result);
					return self.sendMultiRequest(query, cb);

				}
				else
					cb(null)
			}else
				cb(err);
		});
	}

	self.markProductsAsSold = function(prods, cb){

		if(!Array.isArray(prods))
			prods = new Array(prods)

		for(var i = 0; i < prods.length;i++){

			prods[i] = {productID:prods[i].productID, status:"ARCHIVED"};
			prods[i].attributeName1 = "dateSold";
			prods[i].attributeValue1 = (Math.round(new Date().getTime()/1000));
			prods[i].attributeType1 = "integer";
			prods[i].attributeName2 = "markSold";
			prods[i].attributeValue2 = 1;
			prods[i].attributeType2 = "integer";

		}

		query = self.generateMultiReq("saveProduct", prods);
		return self.sendMultiRequest(query, cb);

	}
	self.unmarkProductsAsSold = function(prods, cb){

		if(!Array.isArray(prods))
			prods = new Array(prods)

		var marked = []

		for(var i = 0; i < prods.length;i++){

			var p = {cmd:'saveProduct', productID:prods[i].productID, groupID:prods[i].groupID, status:"ACTIVE", active:1};

			p.attributeName1 = "dateSold";
			p.attributeValue1 = null;
			p.attributeType1 = "integer";
			p.attributeName2 = "markSold";
			p.attributeValue2 = 0;
			p.attributeType2 = "integer";
			marked.push(p)
			marked.push({cmd:'saveInventoryRegistration', warehouseID:prods[i].warehouseID || self.WAREHOUSE_ID, productID1:prods[i].productID, amount1:1.0})

		}

		query = self.generateMultiReq(null, marked);
		return self.sendMultiRequest(query, cb);

	}

	self.restockProducts = function(prods, warehouseID, cb){

		if(!Array.isArray(prods))
			prods = new Array(prods)

		var q = {warehouseID: warehouseID || self.WAREHOUSE_ID}

		for(var i = 0; i < prods.length;i++){

			q['productID'+(i+1)] = prods[i].productID;
			q['amount'+(i+1)] = prods[i].amount;

		}
		log(q)
		self.sendRequest('saveInventoryRegistration', q, cb)

	}

	self.unMarkSoldProducts = function(cb){

		return self.sendRequest("getProducts", {recordsOnPage:1000, status:"ARCHIVED", changedSince: Math.round(new Date(config.system_start_date).getTime()/1000) }, function(err, result){

			if(!err){
				result = result.result;
				if(result.length){

					var cmd = "saveProduct";
					var query;

					for(var i = 0; i < result.length;i++){
						result[i] = {productID:result[i].productID, status:"ACTIVE"};
					}

					query = self.generateMultiReq(cmd, result);
					return self.sendMultiRequest(query, cb)

				}
				else
					cb(null)
			}else
				cb(err);
		});
	}

	self.markProductsAsPaidToReseller = function(prod_ids, cb){

		if(!Array.isArray(prod_ids))
			prod_ids = new Array(prod_ids)

		for(var i = 0; i < prod_ids.length;i++){

			prod_ids[i] = {productID:prod_ids[i], recordsOnPage:100};
			prod_ids[i].attributeName1 = "datePaidToReseller";
			prod_ids[i].attributeValue1 = (Math.round(new Date().getTime()/1000));
			prod_ids[i].attributeType1 = "integer";
		}

		query = self.generateMultiReq("saveProduct", prod_ids);
		return self.sendMultiRequest(query, cb);

	}

	self.unmarkProductsAsPaidToReseller = function(prod_ids, cb){

		if(!Array.isArray(prod_ids))
			prod_ids = new Array(prod_ids)

		for(var i = 0; i < prod_ids.length;i++){

			prod_ids[i] = {productID:prod_ids[i], recordsOnPage:100};
			prod_ids[i].attributeName1 = "datePaidToReseller";
			prod_ids[i].attributeValue1 = 0
			prod_ids[i].attributeType1 = "integer";
		}

		query = self.generateMultiReq("saveProduct", prod_ids);
		return self.sendMultiRequest(query, cb);

	}
	self.getBuyinGroup = function(cb){

		return self._getGroupByName("buyin", cb);

	}

	self.getWarehouseGroup = function(cb){

		return self._getGroupByName("warehouse", cb);
	}

	self.getNoTicketGroup = function(cb){

		return self._getGroupByName("no ticket", cb);
	}

	self.getGiftcardGroup = function(cb){

		return self._getGroupByName("giftcards", cb);

	}

	self._getGroupByName = function(name, cb){

		if(!self.ERPLY_GROUPS){
			cb("There are no ERPLY groups!")
			return false;
		}

		var regex = new RegExp(name, "gi");
		for(var i = 0; i <  self.ERPLY_GROUPS.length; i++){
			if(self.ERPLY_GROUPS[i].name.match(regex)){
				if(cb)
					cb(self.ERPLY_GROUPS[i])
				return self.ERPLY_GROUPS[i]
			}
		}
	}
	self.getGroupByCode = function(groupCode){

		if(!groupCode || !self.ERPLY_GROUPS) return {};
		
		
		for(var i = 0; i <  self.ERPLY_GROUPS.length; i++){
			if(self.ERPLY_GROUPS[i] && self.ERPLY_GROUPS[i].productGroupCode && self.ERPLY_GROUPS[i].productGroupCode.toLowerCase() === groupCode.toLowerCase())
				return self.ERPLY_GROUPS[i]
		}
		
		return {};
	}
	self.getGroupByID = function(groupID, cb){

		if(!self.ERPLY_GROUPS){
			cb("There are no ERPLY groups!")
			return false;
		}

		
		for(var i = 0; i <  self.ERPLY_GROUPS.length; i++){
			if(self.ERPLY_GROUPS[i].productGroupId === groupID){
				if(cb)
					cb(self.ERPLY_GROUPS[i])

				return self.ERPLY_GROUPS[i]
			}
		}
		if(cb) cb({});
		
		return false;
	}

	self.saveProductGroup = function(product_group, cb){

		var cmd = "saveProductGroup";
		var query;

		query = {};

		if(product_group.parentID)
			query.parentID = product_group.parentID;
		if(product_group.productGroupID)
			query.productGroupID = product_group.productGroupID;
		if(product_group.name)
			query.name = product_group.name;
		
		if(product_group.productGroupCode){
			query.attributeName1 = "productGroupCode";
			query.attributeValue1 = product_group.productGroupCode.toUpperCase();
			query.attributeType1 = "text";
		}
		if(product_group.isReseller){
			query.attributeName2 = "isReseller";
			query.attributeValue2 = 1
			query.attributeType2 = "int";
		}


		return self.sendRequest(cmd, query, function(err, product_group){

			if(!err){
				self.getAllProductGroups(function(err, resp){
					cb(err, product_group)
				})
			}else
				cb(err);

		});

	}

	self.deleteProductGroup = function(group_id, cb){

		var q;
		var cmd = "deleteProductGroup";

		if(Array.isArray(group_id)){
			q = self.generateMultiReq(cmd, group_id);
			cmd = "multi";
		}
		else
			q = {productGroupID:group_id}

		if(q){

			return self.sendRequest(cmd, q, function(err, product_group){

				if(!err){
					self.getAllProductGroups(function(err, resp){
						cb(err, product_group)
					})
				}else
					cb(err);

			});
		}
	}

	self.getAllProductCategories = function(cb){


		return self.sendRequest("getProductCategories", {recordsOnPage:500}, function(err, pcategories){

			if(pcategories)
				self.ERPLY_CATEGORIES = self._removeElement(pcategories, "productCategoryName", "Default category");

			 if(cb)
				cb(err, self.ERPLY_CATEGORIES);

		});

	}

	self.deleteProductCategory = function(cat_id, cb){

		var query = {}
		var cmd = "deleteProductCategory";

		if(Array.isArray(cat_id)){
			query = self.generateMultiReq(cmd, cat_id)
			cmd = "multi"
		}
		else
			query = {productCategoryID:cat_id}

		return self.sendRequest(cmd, query, function(err, product_category){

			if(cb)
				cb(err, product_category);

			if(!err)
				//Refresh
				self.getAllProductCategories();

		});

	}

	self.saveProductCategory = function(name, id, cb){

		var params = {name:name}

		if(typeof id === "function")
			cb = id;
		else if(!isNaN(id))
			params.productCategoryID = id;

		return self.sendRequest("saveProductCategory", params, function(err, product_category){

			if(!err && product_category && product_category.length>0)
				product_category = {productCategoryID:product_category[0].productCategoryID, productCategoryName:name}

			if(cb)
				cb(err, product_category);

			if(!err)
				//Refresh
				self.getAllProductCategories();

		});

	}

	self.saveBrand = function(name, id, cb){

		var params = {name:name}

		if(typeof id === "function")
			cb = id;
		else if(!isNaN(id))
			params.brandID = id;

		return self.sendRequest("saveBrand", params, function(err, brand){


			if(!err && brand && brand.length>0){
				brand = {brandID:brand[0].brandID, name:name}

				//Refresh
				self.getAllBrands();
			}

			if(cb)
				cb(err, brand);

		});

	}

	self.saveCustomer = function(customer, cb){

		if(!customer){
			cb("Customer not selected!");
			return false;
		}
		var c = {}

		if(customer.customerID)
			c.customerID = customer.customerID;
		if(typeof customer.credit !== "undefined")
			c.credit = customer.credit;
		if(customer.firstName)
			c.firstName = customer.firstName;
		if(customer.lastName)
			c.lastName = customer.lastName;
		if(c.fullName && c.lastName)
			c.fullName =  c.firstName + " " + c.lastName;
		if(customer.email)
			c.email = customer.email.toLowerCase();
		if(customer.phone)
			c.phone = customer.phone;
		if(customer.code)
			c.code = customer.code;
		if(customer.birthday)
			c.birthday = customer.birthday;

		if(!(c.firstName && c.lastName) ){
			cb("Customer data invalid. Customer must have a first and last name");
			return false;
		}
		if(!c.added){
			c.attributeName1 = "added";
			c.attributeValue1 = Math.round(new Date().getTime() / 1000);
			c.attributeType1 = "int";
		}

		if(!c.warehouseID){
			c.attributeName2 = "warehouseID";
			c.attributeValue2 = self.WAREHOUSE_ID;
			c.attributeType2 = "int";
		}
				
		return self.sendRequest("saveCustomer", c, function(err, cust){

			if(!err){

				if(cust.length>0 && cust[0].customerID){

					self.getCustomer(cust[0].customerID, function(err, c){
						cb(err,c)
						if(!err)
							log("Customer - " + (customer.customerID ? "Updated": "Added") +  " " + c.fullName + " (" + c.customerID + ") " + c.credit + "EUR")
					});
				}
				else
					cb("Can't get customer ID");
			}
			else{
				cb(err);
			}
		});

	}
	self.saveCustomerMulti = function(customers, cb){

		var query = self.generateMultiReq("saveCustomer",customers);
		return self.sendMultiRequest(query,cb);

	}
	self.deleteCustomer = function(id, cb){

		return self.sendRequest("deleteCustomer", {customerID:id}, cb)

	}
	self.deleteCustomerCredit = function(id, amount, cb){

		self.getCustomer(id, function(err, customer){
			if(err){
				cb(err);
				return;
			}

			if(customer){
				log("Customer - Reduced " + customer.fullName + " (" + customer.customerID + ") credit with " + amount + "EUR");
				customer.credit = (customer.credit - amount);

				if(customer.credit < 0)
					customer.credit = 0;
				
				self.saveCustomer(customer, cb)

			}else
				cb("Customer does not exist!")

		})
	}

	self.changeCustomerCredit = function(id, amount, cb){

		self.getCustomer(id, function(err, customer){
			if(err){
				cb(err);
				return;
			}

			if(customer){
				log("Customer - Changed " + customer.fullName + " (" + customer.customerID + ") credit from " + customer.credit + " to " + (customer.credit + amount))
				customer.credit = customer.credit + amount;

				if(customer.credit < 0)
					customer.credit = 0;

				self.saveCustomer(customer, cb)

			}else
				cb("Customer does not exist!")

		})
	}
	self.payCreditInvoices = function(cb, wh){

		if(!cb) cb = function(e,r){log(e); log(r);}

		self.sendRequest("getSalesDocuments", {unpaidItemsOnly:1, invoiceState:"READY", warehouseID: wh || self.WAREHOUSE_ID}, function(err, invoices){

			if(err)
				return cb(err);
				
			if(!invoices.length)
				return cb()

			var customers = []
			var cust_names = []
			var payments = []
			

			for (var i = 0; i < invoices.length; i++) {
				var paid_credit = parseFloat(invoices[i].amountPaidWithStoreCredit);
				if(paid_credit>0){
					cust_names.push({customerID:invoices[i].clientID, name:invoices[i].clientName, amount:paid_credit})
					customers.push({customerID:invoices[i].clientID, amount:paid_credit})
					payments.push({warehouseID:wh || self.WAREHOUSE_ID, id:invoices[i].id, customerID:invoices[i].clientID, paymentType:"CREDIT", paymentStatus:"PAID", amountPaidWithStoreCredit:paid_credit});

				}
			};
			
			if(!customers.length || !payments.length){
				cb()
				return;
			}

			var funcs = []
			for (var i = 0; i < payments.length; i++)
				funcs.push(function(callback){ self.sendRequest("saveSalesDocument", this, callback);}.bind(payments[i]) );

			for (var i = 0; i < customers.length; i++)
				funcs.push(function(callback){ self.deleteCustomerCredit(this.customerID, this.amount, callback); }.bind(customers[i]) );

			async.series(funcs, function(err){

				if(!err)
					cb(null,cust_names)
				else
					cb(err)

			})

		})
	}

	self.addCustomerCredit = function (customerID, paymentID, sum, cb){

		if(!customerID) return cb("No customerID given!")

		var q = {customerID:customerID, sum:sum, addedToStoreCredit:1, type:"CREDIT"}
		if(paymentID) q.paymentID = paymentID;
		self.sendRequest("savePayment", q, cb)
	}

	self.getDayClosing = function(date, cb){

		if(!cb) cb = function(e,r){log(r)}

		if(!date)
			date = new Date();

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var openedUnixTimeFrom = Math.round(date.getTime() / 1000);

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var openedUnixTimeUntil = Math.round(date.getTime() / 1000);

		return self.sendRequest("getDayClosings", {openedUnixTimeFrom:openedUnixTimeFrom, openedUnixTimeUntil:openedUnixTimeUntil, warehouseID:self.DISPLAY_WAREHOUSE_ID}, cb);
	}

	self.getCashInOutSince = function(date, cb){

		if(!date)
			date = new Date(config.system_start_date);

		return self.sendRequest("getCashIns", {changedSince:Math.round(date.getTime()/1000)}, cb);
	}

	self.getCashInOut = function(date, options, cb){

		if(typeof options === "function"){
			cb = options;
			options = {};
		}
		if(!options) options = {}

		if(!date)
			date = new Date();

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var dateTimeFrom = moment(date).format("YYYY-MM-DD HH:mm:ss")

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var dateTimeUntil = moment(date).format("YYYY-MM-DD HH:mm:ss")

		return self.sendRequest("getCashIns", {dateTimeFrom:dateTimeFrom, dateTimeUntil:dateTimeUntil, warehouseID:(options.warehouseID ? options.warehouseID : self.DISPLAY_WAREHOUSE_ID)}, cb);
	}

	self.getCashInOutMonth = function(year, month, cb){


		var date = new Date(year + "-" + month + "-01");

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var dateTimeFrom = moment(date).format("YYYY-MM-DD HH:mm:ss")

		date.setDate(moment(date).daysInMonth()-1);
		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var dateTimeUntil = moment(date).format("YYYY-MM-DD HH:mm:ss")

		return self.sendRequest("getCashIns", {dateTimeFrom:dateTimeFrom, dateTimeUntil:dateTimeUntil,warehouseID:self.DISPLAY_WAREHOUSE_ID }, cb);
	}

	self.getCashInOutMonthAll = function(year, month, cb){


		var date = new Date(year + "-" + month + "-01");

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var dateTimeFrom = moment(date).format("YYYY-MM-DD HH:mm:ss")

		date.setDate(moment(date).daysInMonth()-1);
		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var dateTimeUntil = moment(date).format("YYYY-MM-DD HH:mm:ss")

		return self.sendRequest("getCashIns", {dateTimeFrom:dateTimeFrom, dateTimeUntil:dateTimeUntil }, cb);
	}

	self.getClockins = function(date, warehouseID, cb){
		
		if(!date)
			date = new Date();

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var inUnixTimeFrom = Math.round(date.getTime() / 1000);

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var inUnixTimeUntil = Math.round(date.getTime() / 1000);
		var q = {inUnixTimeFrom:inUnixTimeFrom, inUnixTimeUntil:inUnixTimeUntil}
		if(warehouseID)
			q.warehouseID = warehouseID;
		
		return self.sendRequest("getClockIns", q, cb);
	}
	self.getClockinsMonth = function(year, month, options, cb){
		
		var dateFrom = moment().year(year).month(month-1).date(1).hour(0).minute(0).second(1);
		var dateTo = moment().year(year).month(month-1).date(dateFrom.daysInMonth()).hour(23).minute(59).second(59);
		self.getClockinsRange(dateFrom.toDate(), dateTo.toDate(), options, cb)

	} 
	self.getClockinsRange = function(dateFrom, dateTo, options, cb){
		
		if(typeof options === "function"){
			cb = options;
			options = {};
		}
		if(!options) options = {}

		dateFrom.setHours(0);
		dateFrom.setMinutes(0);
		dateFrom.setSeconds(0);

		var inUnixTimeFrom = Math.round(dateFrom.getTime() / 1000);
		
		dateTo.setHours(23);
		dateTo.setMinutes(59);
		dateTo.setSeconds(59);

		var inUnixTimeUntil = Math.round(dateTo.getTime() / 1000);
		var query = {inUnixTimeFrom:inUnixTimeFrom, inUnixTimeUntil:inUnixTimeUntil};
		
		if(options.warehouseID)
			query.warehouseID = options.warehouseID;
		
		return self.sendRequest("getClockIns", query, cb);
	}
	self.clockIn = function(employeeID, options, cb){

		return self.sendRequest("clockIn", {
			employeeID:employeeID, 
			pointOfSaleID:self.ERPLY_REGISTERS[0].pointOfSaleID,
			warehouseID:self.WAREHOUSE_ID,
			InUnixTime:(options.InUnixTime || moment().unix())
		}, cb);

	}
	self.clockOut = function(employeeID, options, cb){

		return self.sendRequest("clockOut", {
			employeeID:employeeID, 
			pointOfSaleID:self.ERPLY_REGISTERS[0].pointOfSaleID,
			warehouseID:self.WAREHOUSE_ID,
			InUnixTime:options.InUnixTime,
			OutUnixTime:(options.OutUnixTime || moment().unix())
		}, cb);		
	}
	self.isClockedIn = function(employeeID, cb){

		employeeID = parseInt(employeeID)

		self.getClockins(new Date(), {warehouseID:self.WAREHOUSE_ID}, function(err, clockins){

			if(err)
				return cb(err)

			cb(null, clockins.filter(function(o){ return o.employeeID === employeeID}).length)

		})
	}
	self.getDayActivity = function(date, options, cb){

		if(!date)
			date = new Date();

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var dateTimeFrom = Math.round(date.getTime() / 1000);
		var dateTimeFromISO = moment(date).format("YYYY-MM-DD HH:mm:ss")

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var dateTimeUntil = Math.round(date.getTime() / 1000);
		var dateTimeUntilISO = moment(date).format("YYYY-MM-DD HH:mm:ss")

		var yesterday = new Date(date)
		yesterday.setDate(date.getDate()-1)

		yesterday.setHours(0);
		yesterday.setMinutes(0);
		yesterday.setSeconds(0);

		var dateTimeFromYesterday = Math.round(yesterday.getTime() / 1000);

		yesterday.setHours(23);
		yesterday.setMinutes(59);
		yesterday.setSeconds(59);

		var dateTimeUntilYesterday = Math.round(yesterday.getTime() / 1000);		


		var clockins = {cmd:"getClockIns", inUnixTimeFrom:dateTimeFrom, inUnixTimeUntil:dateTimeUntil, recordsOnPage:100}

		if(options.warehouseID)
			clockins.warehouseID = options.warehouseID;

		var funcs = []
		funcs.push({cmd:"getDayClosings", openedUnixTimeFrom:dateTimeFromYesterday, openedUnixTimeUntil:dateTimeUntil, recordsOnPage:100})
		funcs.push(clockins)
		var q = self.generateMultiReq(null,funcs);
		
		return self.sendMultiRequest(q, function(err, r){
			if(err) return cb(err)
				
			var closings = {}
			var result = r.getDayClosings.result;

			if(result && result.length){
				closings.getDayClosingsYesterday = {result:[]}
				closings.getDayClosings = {result:result}
				
				for (var i = result.length-1; i >= 0; i--) {
					var day = moment(new Date(result[i].openedUnixTime*1000))
					
					if(day.diff(date, "days") !== 0){
						closings.getDayClosingsYesterday.result.push(result[i])
						closings.getDayClosings.result.splice(i,1)
					}
				};
				


			}
			r.getDayClosings = closings.getDayClosings;
			r.getDayClosingsYesterday = closings.getDayClosingsYesterday;

			cb(err, r)
		})

	}
	self.getDayClosings = function(date, cb){

		if(!date)
			date = new Date();

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);

		var dateTimeFrom = Math.round(date.getTime() / 1000);
		var dateTimeFromISO = moment(date).format("YYYY-MM-DD HH:mm:ss")

		date.setHours(23);
		date.setMinutes(59);
		date.setSeconds(59);

		var dateTimeUntil = Math.round(date.getTime() / 1000);
		var dateTimeUntilISO = moment(date).format("YYYY-MM-DD HH:mm:ss")

		var yesterday = new Date(date)
		yesterday.setDate(date.getDate()-1)

		yesterday.setHours(0);
		yesterday.setMinutes(0);
		yesterday.setSeconds(0);

		var dateTimeFromYesterday = Math.round(yesterday.getTime() / 1000);

		yesterday.setHours(23);
		yesterday.setMinutes(59);
		yesterday.setSeconds(59);

		var dateTimeUntilYesterday = Math.round(yesterday.getTime() / 1000);		
		
		
		return self.sendRequest("getDayClosings", {openedUnixTimeFrom:dateTimeFromYesterday, openedUnixTimeUntil:dateTimeUntil},function(err, result){
			
			var closings = {}
			
			if(result && result.length){
				closings.getDayClosingsYesterday = {result:[]}
				closings.getDayClosings = {result:result}
				
				for (var i = result.length-1; i >= 0; i--) {
					var day = moment(new Date(result[i].openedUnixTime*1000))
					
					if(day.diff(date, "days") !== 0){
						closings.getDayClosingsYesterday.result.push(result[i])
						closings.getDayClosings.result.splice(i,1)
					}
				};
			}
			
			cb(err,closings);
		})

	}
	self.getDayClosingsRange = function(dateFrom, dateTo, cb){

		
		dateFrom.setHours(0);
		dateFrom.setMinutes(0);
		dateFrom.setSeconds(0);

		var dateTimeFrom = Math.round(dateFrom.getTime() / 1000);
		var dateTimeFromISO = moment(dateFrom).format("YYYY-MM-DD HH:mm:ss")

		dateTo.setHours(23);
		dateTo.setMinutes(59);
		dateTo.setSeconds(59);

		var dateTimeUntil = Math.round(dateTo.getTime() / 1000);
		var dateTimeUntilISO = moment(dateTo).format("YYYY-MM-DD HH:mm:ss")
		
		return self.sendRequest("getDayClosings", {openedUnixTimeFrom:dateTimeFrom, openedUnixTimeUntil:dateTimeUntil},cb);

	}
	self.getArchivedProductsSince = function(changedSince, cb){

		if(!cb) cb = function(e,r){log(r)}

		return self.sendRequest("getProducts", {addedSince:changedSince, recordsOnPage:1000, active:0}, function(err, products){

			if(!err && cb){


				cb(null,products.result)
				/*
				var p = []
				for(var i = 0; i < products.length;i++){
					if(!products[i].dateSold && !products[i].active){
						products[i].active = 1;
						products[i].status = "ACTIVE";
						p.push(products[i]);

					}

				}
				//cb(null, p);

				self.saveProduct(p, function(err,r){
							log(err)
							cb(null, r);
						})

				*/
			}
			else if(cb)
				cb(err);
		});
	}

	self.saveObject = function(obj, group, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}
		
		self.sendRequest("saveObject", self._prepareSaveObject(obj, group), cb)
	}
	self._prepareSaveObject = function(obj, group){

		obj = Object.assign({}, obj)
		var added = new Date();
		var query = {}
		var attrCount = 0;

		if(!obj._added)
			obj._added = Math.floor(added.getTime()/1000);
		if(!obj._dateShort)
			obj._dateShort = moment(added).format("DD-MM-YYYY")

		if(obj.objectID)
			query.objectID = obj.objectID;

		query.group = group;
		query.partnerKey = self.CLIENT_CODE;

		if(!obj.warehouseID)
			obj.warehouseID = self.WAREHOUSE_ID;

		for(key in obj){

			if(Array.isArray(obj[key]) || typeof obj[key] === "object" || key === "objectID" || typeof obj[key] === "undefined" || obj[key] === null)
				continue;

			attrCount++;
			var type;

			if(isFloat(obj[key]))
				type = "float"
			else if(isInteger(obj[key]))
				type = "integer"
			else
				type = "string"

			query["attributeName" + attrCount] = key;
			query["attributeType" + attrCount] = type;
			query["attributeValue" + attrCount] = obj[key];
			
		}

		function isFloat(n) {

			if(!isNaN(n) && typeof n === "string" && n.indexOf(".")>-1) 
				return true;
    		return n === +n && n !== (n|0);
		}

		function isInteger(n) {
    		return n === +n && n === (n|0);
		}

		return query;
	}

	self.getObject = function(id, group, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}
		var query = {objectID:id, group:group, partnerKey:self.CLIENT_CODE}
		self.sendRequest("getObjects", query, cb)

	}
	self.getObjects = function(group, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}
		var query = {group:group, partnerKey:self.CLIENT_CODE, recordsOnPage:500}
		self.sendRequest("getObjects", query, function(e,r){
			cb(e,r)
		})

	}
	self.getObjectsByDate = function(date, group, warehouseID, cb){
		if(typeof warehouseID === "function"){
			cb = warehouseID;
			warehouseID = self.DISPLAY_WAREHOUSE_ID;
		}

		if(typeof date !== "string")
			date = moment(date).format("DD-MM-YYYY")

		self.getObjectsByKey("_dateShort", date, group, warehouseID, function(err,result){
			cb(err, self._objectsByWarehouse(result, warehouseID))
		})
	}
	self.getBuyinsByDate = function(date, warehouseID, cb){

		if(typeof date !== "string")
			date = moment(date).format("DD-MM-YYYY")

		var query = {group:"buyin", searchAttributeName1:"_dateShort", searchAttributeValue1:date, partnerKey:self.CLIENT_CODE}
		
		self.sendRequest("getObjects", query, function(err,result){

			if(err) return cb(err);

			if(!result || !result.length)
				return cb(null, [])
			if(warehouseID !== -1)
				cb(null, self._objectsByWarehouse(result, warehouseID))
			else
				cb(null, result)
		})	
	}
	
	self._objectsByWarehouse = function(objects, warehouseID){

		if(!objects || !objects.length)
			return objects;
		if(!warehouseID)
			warehouseID = self.DISPLAY_WAREHOUSE_ID;
		
		for (var i = objects.length-1; i > -1; i--) {

			if(Array.isArray(objects[i])){

				for (var x = 0; x < objects[i].length; x++) {
					if(!objects[i][x].warehouseID && warehouseID === 1)
						continue;

					if(objects[i][x].warehouseID !== warehouseID)
						objects[i].splice(x,1)	
				};

			} else {
				if(!objects[i].warehouseID && warehouseID === 1)
					continue;

				if(objects[i].warehouseID !== warehouseID)
					objects.splice(i,1)	
			}	
		};

	return objects;
	}
	self.getObjectsByKey = function(key, value, group, warehouseID, cb, all){

		if(typeof warehouseID === "function"){
			cb = warehouseID;
			warehouseID = self.DISPLAY_WAREHOUSE_ID;
		}

		var query = {group:group, searchAttributeName1:key, searchAttributeValue1:value, partnerKey:self.CLIENT_CODE}

		self.sendRequest("getObjects", query, function(err,result){
		
			if(all || !warehouseID)
				cb(err, result)
			else
				cb(err, self._objectsByWarehouse(result, warehouseID))
		})

	}
	self.getAllObjectsByKeys = function(keys, values, group, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		var query = {group:group, partnerKey:self.CLIENT_CODE};

		for (var i = 0; i < keys.length; i++) {
			query["searchAttributeName" + (+1)] = keys[i];
			query["searchAttributeValue" + (+1)] = values[i];
		};
		
		self.sendRequest("getObjects", query, cb);

	}

	self.getMultiObjectsByKeys = function(keys, values, group, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		var query = [];

		for (var i = 0; i < keys.length; i++) {
			keys[i]
			query.push({cmd:"getObjects", group:group, searchAttributeName1:keys[i], searchAttributeValue1:values[i], partnerKey:self.CLIENT_CODE})
		};

		
		self.sendMultiRequest(self.generateMultiReq(null, query), function(err,result){
			cb(err, self._objectsByWarehouse(result))
		}, true)

	}

	self.deleteObject = function(id,cb){

		if(!cb) cb = function(e,r){log(e); log(r)}
		var query = {objectID:id, partnerKey:self.CLIENT_CODE}
		self.sendRequest("deleteObject", query, cb)
	}

	self.deleteObjectByKey = function(key,value,group,cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		self.getObjectsByKey(key, value, group, function(err, obj){

			if(obj && obj.length){
				obj = obj[0];
				self.deleteObject(obj.objectID, cb)
			}
			else
				cb(err)

		})
	}

	self.deleteBuyin = function(id, cb){

		self.deleteObjectByKey("buyinID2", id, "buyin", cb)

	}

	self.getBuyinsByCustomer = function(customer_id, cb){

		if(!cb) cb = function(e,r){log(e); log(r)}

		var query = {group:"buyin", searchAttributeName1:"customerID", searchAttributeValue1:customer_id, recordsOnPage:100, partnerKey:self.CLIENT_CODE}
		self.sendRequest("getObjects", query, cb)

	}
	self.getGiftCard = function(giftCardID, cb){

		self.sendRequest("getGiftCards", {giftCardID:giftCardID}, cb)
	}
	self.getGiftCards = function(cb){

		self.sendRequest("getGiftCards", {}, cb)
	}
	self.getGiftCardRedeemings = function(giftCardID, cb){
		self.sendRequest("getGiftCardRedeemings", (giftCardID ? {giftCardID:giftCardID} : {}), cb)
	}
	/*
	self.saveGiftCard2 = function(value, employeeID, cb){

		if(!self.GC_GROUP)
			return cb("No gift card group found!")

		if(!value || isNaN(value))
			return cb("Value of \"" + value  + "\" is not valid for a giftcard!")

		var giftcard = {
			purchaseWarehouseID : self.WAREHOUSE_ID,
			value : value,
			purchaseDateTime : moment().unix()
		}
		
		var product = {
			groupID:self.GC_GROUP.id,
			price:giftcard.value,
			productGroupCode: self.GC_GROUP.productGroupCode,
			name:"Gift Card " + giftcard.value + "\€",
			isGiftCard:1,
			attributeName1:"employeeIDs",
			attributeType1:"text",
			attributeValue1:employeeID
		} 

		self.saveProduct([product], function(err, p){
				
			if(err) return cb(err);
			
			giftcard.code = p[0].code2;
			
			self.sendRequest("saveGiftCard", giftcard, function(e,r){
		
				if(e) return cb(e);					
				self.getGiftCard(r[0].giftCardID,function(err, g){
					if(g && g.length){
						log(p[0])
						g[0].product = p[0]
					}
					cb(err,g);
				}) 
				
			})
		})
	}
	
	self.saveGiftCard = function(value, employeeID, cb){

		if(!self.GC_GROUP)
			return cb("No gift card group found!")

		if(!value || isNaN(value))
			return cb("Value of \"" + value  + "\" is not valid for a giftcard!")

		
		var product = {
			groupID:self.GC_GROUP.id,
			price:value,
			productGroupCode: self.GC_GROUP.productGroupCode,
			name:"Gift Card " + value + "\€",
			isGiftCard:1,
			taxFree:1,
			attributeName1:"employeeIDs",
			attributeType1:"text",
			attributeValue1:employeeID
		} 

		self.saveProduct([product], cb);
	}
	*/
	self.deleteGiftCard = function(code, cb){

		self.sendRequest("saveGiftCard", {code:code, balance:0}, cb);
	}

	self.generateMultiReq = function(cmd, arr, keys, ean_code){

		var query = [];

		for(var i = 0; i <  arr.length;i++){
			var req = {requestID:(i+1)};
			
			if(!arr[i].cmd)
				req.requestName = cmd;
			else
				req.requestName = arr[i].cmd;

			if(!keys){
				for(key in arr[i]){
					req[key] = arr[i][key];
				}
			} else {


				for(x in keys){
					if(typeof keys[x] === "object"){
						for(key in keys[x]){
							if(arr[i].hasOwnProperty(key)){
								req[keys[x][key]] = arr[i][key];

							}
						}
					}
					else{
						if(arr[i][keys[x]])
							req[keys[x]] = arr[i][keys[x]];
					}

				}
			}

			if(ean_code){
				if(!req.code2)
					req.code2 = (++self.EAN_CODE);

				if(arr[i].productGroupCode && !req.code)
					req.code = self.WAREHOUSE_ID + "-" + (req.code2-self.EAN_START_CODE) + "-" + arr[i].productGroupCode;

			}

			query.push(req);

		}
		
		if(query.length>0)
			return (query);
		else
			return(false)
	}


	self._removeElement = function(arr, elem, value){

		if(arr && arr.length){
			for(i in arr){
				if(arr[i][elem] === value)
					arr.splice(i,1);
			}

		}

	return(arr);
	}

	self.isAdmin = function(user){

		if(!user)
			return false;
		else if(user.groupName && user.groupName.match(/administrator/, "gi") || user.groupName.match(/superadmin/, "gi"))
			return true;
		else
			return false;
	}

	self._sortByKey = function(array, key, asc) {
		return array
		if(!array)
			return array;

    	return array.sort(function(a, b) {
        	var x = a[key]; var y = b[key];
        	if(!asc)
        		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        	else
        		return ((y < x) ? -1 : ((y > x) ? 1 : 0));
    	});
	}

	self._arrayMove = function(arr, fromIndex, toIndex) {
    	var element = arr[fromIndex];
    	arr.splice(fromIndex, 1);
    	arr.splice(toIndex, 0, element);
	}

	self.startWorker = function(cb){

		var cwd = APP_ROOT + "/app/workers";
		self.worker = require("child_process").fork(cwd + "/ErplyRequest.js");

		self.worker.on("message", function(m){

			try{

				var resp = JSON.parse(m);
				
				if(resp.progress){
					//log(resp.rec + " / " + resp.max + " (" + resp.request_id + ")")
					self.emit("progress", {rec:resp.rec, max:resp.max, request_id:resp.request_id});
				}
				/*
				if(resp.request_id === -1) {
					log(resp)
					if(resp.log && typeof resp.log === "string")
						log(resp.log);
					else
						log(resp.log);
				}
				*/
				if(resp && resp.request_count){
					self.REQS_SERVED = resp.request_count;

					if(moment(self.REQS_SERVED_THIS_HOUR.date).isBefore( moment(new Date()), "hour"))
						self.REQS_SERVED_THIS_HOUR = {date:new Date(), count:1};
					else
						self.REQS_SERVED_THIS_HOUR.count++;
				}
				
				if(!resp || !resp.request_id)
					return false;

				if(resp.request_id === -1)
					return;

				var cb = self.worker_cbs[resp.request_id];

				if(!resp.progress){

					cb(resp.err, resp.result)
					delete self.worker_cbs[resp.request_id];
				}

			}catch(err){
				
				for(key in self.worker_cbs)
					self.worker_cbs[key] = function(){};

			}


		})
		self.worker.on("error", function(err){
			console.error(err)

		})
		self.worker.on("exit", function(code, msg){
			
			

		})
		self.worker.on("close", function(code, msg){
			

		})
		self.setWorkerOptions({url:self.API_ENDPOINT, delay:self.API_DELAY_REQUESTS})
		

	return self.worker;
	}

	self.sendToWorker = function(obj, cb){

		if(!self.worker || !self.worker.connected){
			self.restartWorker();
			setTimeout(function(){self.sendToWorker(obj,cb);}, 3000);
			return;
		}

		if(!obj || !obj.request_id){
			cb("Invalid request ID!")
			return;
		}

		self.worker_cbs[obj.request_id] = cb;
		self.worker.send(JSON.stringify(obj));

	}
	self.stopWorker = function(){

		try{
			
			if(self.worker){
				if(self.worker.connected){
					self.worker.kill("SIGHUP");
					self.worker.connected = false;
				}
			}
		}catch(err){

			console.error(err);
		}
	}
	self.restartWorker = function(cb){

		log("RESTARTING ERPLY WORKER")
		self.stopWorker();
		self.worker = self.startWorker(cb);
	}

	self.setWorkerOptions = function(opt){

		if(self.worker && self.worker.connected){
			self.worker.send(JSON.stringify(opt))
		}else{
			self.restartWorker(function(){
				self.worker.send(JSON.stringify(opt))	
			})
		}
	}
	self.setDebug = function(on){
		self.HTTP_DEBUG_MODE = on ? on : false;
		//self.setWorkerOptions({debug:self.HTTP_DEBUG_MODE})
	}
	self.getReqsPerHour = function(){

		 var hours = Math.abs(self.STARTED_AT - new Date()) / 36e5;

		 return(Math.ceil(self.REQS_SERVED / (Math.abs(self.STARTED_AT - new Date()) / 36e5)))

	}
	self.getReqsThisHour = function(){

		 return self.REQS_SERVED_THIS_HOUR.count;

	}
	self.erplyError = function(code, status){

		code = parseInt(code);
		var err = self.ERPLY_ERROR[0];

		for(var i = 0; i < self.ERPLY_ERROR.length;i++){
			if(self.ERPLY_ERROR[i].code === code){
				err = self.ERPLY_ERROR[i];
				break;
			}
		}

		if(code === 1002)
			err.description = "Hourly ERPLY request limit reached. Please resume at: " + moment().add(1,"hours").format("HH") + ":00";

		err.error = true;
		err.status = status;
		err.message = "Erply error";

	return(err);
	}

	self._getTimestamp = function(records){
		var timestamp = 0;

		if(!records || !records.length)
			return timestamp;

		for (var i = 0; i < records.length; i++) {
			if(!records[i]._timestamp)
				continue;
			if(timestamp === 0)
				timestamp = records[i]._timestamp;
			if(timestamp > records[i]._timestamp)
				timestamp = records[i]._timestamp;
		}
		return timestamp;
	}

	self.ERPLY_ERROR = [
		{code:-1, description:"Unknown error"},
		{code:1000, description:"API is under maintenance, please try again in a couple of minutes"},
		{code:1001, description:"Account not found"},
		{code:1002, description:"Hourly request limit (by default 1000 requests) has been exceeded for this account. Please resume next hour"},
		{code:1003, description:"Cannot connect to account database"},
		{code:1005, description:"API call (input parameter \"request\") not specified, or unknown API call"},
		{code:1006, description:"This API call is not available on this account. Account needs upgrading, or an extra module needs to be installed"},
		{code:1007, description:"Unknown output format requested; input parameter \"responseType\" should be either \"JSON\" or \"XML\""},
		{code:1008, description:"Either a) database is under regular maintenance (please try again in a couple of minutes), or b) your application is not connecting to the correct API server"},
		{code:1009, description:"This API call requires authentication parameters (a session key, authentication key, or service key), but none were found"},
		{code:1010, description:"Required parameters are missing. Attribute \"errorField\" indicates the missing input parameter"},
		{code:1011, description:"Invalid classifier ID, there is no such item. Attribute \"errorField\" indicates the invalid input parameter"},
		{code:1012, description:"A parameter must have a unique value. Attribute \"errorField\" indicates the invalid input parameter"},
		{code:1013, description:"Inconsistent parameter set (for example, both product and service IDs specified for an invoice row)"},
		{code:1014, description:"Incorrect data type or format. Attribute \"errorField\" indicates the invalid input parameter"},
		{code:1015, description:"Malformed request (eg parameters containing invalid characters)"},
		{code:1016, description:"Invalid value. Attribute \"errorField\" indicates the field that contains an invalid value"},
		{code:1017, description:"Document has been confirmed and its contents and warehouse ID cannot be edited any more"},
		{code:1020, description:"Bulk API call contained more than 100 sub-requests (max 100 allowed) The whole request has been ignored"},
		{code:1021, description:"Another instance of the same report is currently running. Please wait and try again in a minute. For long-running reports, API processes incoming requests only one at a time"},
		{code:1040, description:"Invalid coupon identifier. Such coupon has not been issued"},
		{code:1041, description:"Invalid coupon identifier. This coupon has already been redeemed"},
		{code:1042, description:"Customer does not have enough reward points"},
		{code:1043, description:"Employee already has an appointment on that time slot. Please choose a different start and end time for appointment"},
		{code:1044, description:"Default length for this service has not been defined in Erply backend. Cannot suggest possible time slots"},
		{code:1045, description:"Invalid coupon identifier. This coupon has expired"},
		{code:1046, description:"Sales Promotion. The promotion contains multiple conflicting requirements or conditions, please specify only one"},
		{code:1047, description:"Sales Promotion. Promotion requirements or conditions not specified"},
		{code:1048, description:"Sales Promotion. The promotion contains multiple conflicting awards, please specify only one"},
		{code:1049, description:"Sales Promotion. Promotion awards not specified"},
		{code:1050, description:"Username/password missing"},
		{code:1051, description:"Login failed"},
		{code:1052, description:"User has been temporarily blocked because of repeated unsuccessful login attempts"},
		{code:1053, description:"No password has been set for this user, therefore the user cannot be logged in"},
		{code:1054, description:"API session has expired. Please call API \"verifyUser\" again (with correct credentials) to receive a new session key"},
		{code:1055, description:"Supplied session key is invalid; session not found"},
		{code:1056, description:"Supplied session key is too old. User switching is no longer possible with this session key, please perform a full re-authentication via API \"verifyUser\""},
		{code:1057, description:"Your time-limited demo account has expired. Please create a new ERPLY demo account, or sign up for a paid account"},
		{code:1060, description:"No viewing rights (in this module/for this item)"},
		{code:1061, description:"No adding rights (in this module)"},
		{code:1062, description:"No editing rights (in this module/for this item)"},
		{code:1063, description:"No deleting rights (in this module/for this item)"},
		{code:1064, description:"User does not have access to this location (store, warehouse)"},
		{code:1065, description:"This user account does not have API access. It may be limited to POS or Erply backend operations only"},
		{code:1071, description:"This customer can buy for a full up-front payment only"},
		{code:1072, description:"This customer does not earn new reward points and cannot exchange reward points for coupons"},
		{code:1080, description:"Printing service is not running at the moment. User can turn printing service on from their Erply account)"},
		{code:1081, description:"E-mail sending failed"},
		{code:1082, description:"E-mail sending has been incorrectly set up, review settings in ERPLY. Missing senderâEUR™s address or empty message content)"},
		{code:1090, description:"No file attached"},
		{code:1091, description:"Attached file is not encoded with Base64"},
		{code:1092, description:"Attached file exceeds allowed size limit"}
	];
}
util.inherits(ERPLY, require('events').EventEmitter);
module.exports = ERPLY;