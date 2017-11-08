/**
 * Module dependencies.
 */

var express = require('../../..');
var fs = require('fs');
var path = require('path');

//
module.exports = function (parent, options) {
    var dir = path.join(__dirname, '..', 'controllers');
    var verbose = options.verbose;
    fs.readdirSync(dir).forEach(function (name) {
        var file = path.join(dir, name)
        if (!fs.statSync(file).isDirectory()) return;
        verbose && console.log('\n   %s:', name);
        var obj = require(file);
        var name = obj.name || name;
        var prefix = obj.prefix || '';
        var app = express();
        var handler;
        var method;
        var url;

        // allow specifying the view engine 指定视图引擎 通过引入JS文件里面的参数进行判断，比如：exports.engine = 'ejs';
        if (obj.engine) app.set('view engine', obj.engine);
        app.set('views', path.join(__dirname, '..', 'controllers', name, 'views'));

        // generate routes based
        // on the exported methods
        for (var key in obj) {
            // "reserved" exports
            if (~['name', 'prefix', 'engine', 'before'].indexOf(key)) continue;
            // route exports
            switch (key) {
                case 'show':
                    method = 'get';
                    url = '/' + name + '/:' + name + '_id';
                    break;
                case 'list':
                    method = 'get';
                    url = '/' + name + 's';
                    break;
                case 'edit':
                    method = 'get';
                    url = '/' + name + '/:' + name + '_id/edit';
                    break;
                case 'update':
                    method = 'put';
                    url = '/' + name + '/:' + name + '_id';
                    break;
                case 'create':
                    method = 'post';
                    url = '/' + name;
                    break;
                case 'index':
                    method = 'get';
                    url = '/';
                    break;
                case 'test1':
                    method = 'get';
                    url = '/' + name+'/test1';
                    break;
                default:
                    /* istanbul ignore next */
                    throw new Error('unrecognized route: ' + name + '.' + key);
            }

            // setup
            handler = obj[key];
            url = prefix + url;

            // before middleware support
            if (obj.before) {
                app[method](url, obj.before, handler);//给对应的URL配置对应的callback 例如：GET /users -> before -> list    访问/users 会回调exports.before 以及 exports.list  （app.get('/users', obj.before, obj.list);）
                verbose && console.log('     %s %s -> before -> %s', method.toUpperCase(), url, key);
            } else {
                app[method](url, handler);
                verbose && console.log('     %s %s -> %s', method.toUpperCase(), url, key);
            }
        }

        // mount the app
        parent.use(app);
    });
};

//给controller的js配置路由 配置结果如下
// main:
//     GET / -> index  访问/时调用index方法（exports.index）
//
// pet:
//     GET /pet/:pet_id -> before -> show
// GET /pet/:pet_id/edit -> before -> edit
// PUT /pet/:pet_id -> before -> update
//
// user:
//     GET /users -> before -> list
// GET /user/:user_id/edit -> before -> edit
// GET /user/:user_id -> before -> show
// GET /user/test1 -> before -> test1
// PUT /user/:user_id -> before -> update
//
// user-pet:
// POST /user/:user_id/pet -> create