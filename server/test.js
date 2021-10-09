const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const colors = require('colors');
const path = require('path')
const axios = require('axios')
const Errors = require('./common/errors');

const testApi = async (app, type = undefined, status = undefined , usr) =>{
    return console.log('tests disabled')
    let user = null;
    try{
        if(usr)
            user = await login(usr);

    }catch(err){
        return console.error('failed to log in')    
    }
    
    
    const checked = []
    const errors = []
    let log = []
    let apiPoints = restPaths(app);

    if(type)
        apiPoints = apiPoints.filter((p)=>p.method === type)

    //apiPoints = apiPoints.filter((p)=>p.method !== 'DELETE' && p.path.indexOf('signup') === -1 && p.path.indexOf('logout') === -1 && p.path.indexOf('login') === -1)
    console.log('Testing', apiPoints.length, 'API points')
    //axios.defaults.headers.common['Authorization'] = user.token
    for (var i = 0; i < apiPoints.length; i++) {
        try{
            console.log('http://localhost:3000/' + apiPoints[i].path)
            const res = await axios({
                url: 'http://localhost:3000/' + apiPoints[i].path,
                method: apiPoints[i].method,
                withCredentials: false,
                headers: {
                    //Authorization: user.token,//'Content-Type': 'multipart/form-data',
                }
            })

            checked.push({endpoint:apiPoints[i], data:res.data})
            log.push([apiPoints[i].method, apiPoints[i].path, 'CHECKED', parseInt(res.status), null])
        }catch(err){
            const msg = err.response && err.response.data.message ? err.response.data.message : err
            const status  = err.response ? err.response.status : 0;
            log.push([apiPoints[i].method, apiPoints[i].path, 'FAILED', parseInt(status), msg])

        }
    }
    if(status)
        log = log.filter((p)=>p[2] === status)

    console.log('PASSED:', checked.length + '/' + apiPoints.length)
    
    //log = log.filter((l)=>l[3]!== 401);
    //log = log.filter((l)=>l[3]=== 401);

    log.forEach((log)=>{
        if(log[2] === 'FAILED'){
            if(log[3] === 401)
                console.error(colors.red('DENIED' + '\t' + log[0] + '\t' + log[3] + '\t/' +   log[1]), colors.gray(log[4]));
            else
                console.error(colors.cyan('CHECKED' + '\t' + log[0] + '\t' + log[3] + '\t/' + log[1]), colors.gray(log[4]));
        }
        else
            console.log(colors.green(log[2] + '\t' + log[0] + '\t' + log[3] + '\t/' + log[1]))
    })
    return true;
}

const restPaths = function(app){
    const rts = []
    function print (path, layer) {
      if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
      } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
      } else if (layer.method) {
        const p = {
            method:layer.method.toUpperCase(),
            path: path.concat(split(layer.regexp)).filter(Boolean).join('/')
        }
        if(!rts.filter((rt)=>rt.method === p.method && rt.path === p.path).length)
            rts.push(p)
      }
    }

    function split (thing) {
      if (typeof thing === 'string') {
        return thing.split('/')
      } else if (thing.fast_slash) {
        return ''
      } else {
        var match = thing.toString()
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '$')
          .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
        return match
          ? match[1].replace(/\\(.)/g, '$1').split('/')
          : '<complex:' + thing.toString() + '>'
      }
    }
    app._router.stack.forEach(print.bind(null, []))
    return rts;
}

const login = async (user) =>{
    try{
        let defaultUser = {email:process.env.ROOT_USER_EMAIL, password:process.env.ROOT_USER_PASSWORD}

        const ax = await axios.create({
            withCredentials: true,
        })
        user = await axios({
            url: 'http://localhost:3000/verification/login',
            method: 'POST',
            data: {...defaultUser},
            withCredentials: true,
            headers: {
                Accept: 'application/json',
             //   'Content-Type': 'multipart/form-data',
            }
        })
        //console.log(user)
        console.log(user.data.email, 'logged in', user.data.role)
        return user.data;
        
    }catch(err){
        console.log(err.response.data)
        return null;
    }
}
const checkErrors = async () => {
    let length = 0;
    let txt = ''
    let msgs = []
    console.log('Error codes ------------')
    Object.keys(Errors).forEach((key)=>{
        if(typeof Errors[key] === 'object'){
            //console.log(Errors[key].code + ' - ' + Errors[key].message['en'] + ' (' + (Errors[key].message['fr'] ? 'TRUE' : 'FALSE') + ')')
            let m = {}
            m[key] = Errors[key].message;

            msgs.push(m)
            //txt += 'const ' + key + ' = ' + Errors[key].code + ';\n';
            txt += Errors[key].message.en + '\n';
            length++
            
        }
    })
    console.log(txt)
    //console.log(JSON.stringify(msgs,null,4))
    console.log(length)
    console.log('--------------------')
    return
    /*
    Object.keys(Errors).forEach(async (key)=>{
        if(typeof Errors[key] === 'object'){
            try{
                const text = await translate(Errors[key].message['en'], {from:'en', to:'fr'});
                console.log(Errors[key].message['en'])
                console.log(text)
            }catch(err){
                console.log(err)
            }
        }
    })
    */
    
}
module.exports = {
    restPaths,
    testApi,
    checkErrors
}