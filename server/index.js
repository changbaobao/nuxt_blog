const Koa = require('koa');
const consola = require('consola');
const session = require('koa-generic-session');
const Redis = require('koa-redis');
const bodyparser = require('koa-bodyparser');
const { Nuxt, Builder } = require('nuxt');
// 输出有意思的字符串
const Alphabet = require('alphabetjs');
// 集成日志
// const logUtil = require('../utils/log_util');
// 自定义api接口
const city = require('./api/city');
const user = require('./api/user');
const login = require('./api/login');

const app = new Koa();
const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 3000;
// mongodb
const mongoose = require('mongoose');
const configs = require('./config');
// Import and Set Nuxt.js options
let config = require('../nuxt.config.js');
config.dev = !(app.env === 'production');

app.keys = ['keys', 'nuxt_blog'];

async function start() {
  // Instantiate nuxt.js
  const nuxt = new Nuxt(config);

  // Build in development
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  }
  // 集成前端日志
  // app.use(async (ctx, next) => {
  //   //响应开始时间
  //   const start = new Date();
  //   //响应间隔时间
  //   var ms;
  //   try {
  //     //开始进入到下一个中间件
  //     await next();

  //     ms = new Date() - start;
  //     //记录响应日志
  //     logUtil.logResponse(ctx, ms);
  //   } catch (error) {
  //     ms = new Date() - start;
  //     //记录异常日志
  //     logUtil.logError(ctx, error, ms);
  //   }
  // });

  // 连接mongodb
  mongoose.connect(
    configs.dbs,
    {
      useNewUrlParser: true
    }
  );
  // redis session
  app.use(
    session({
      key: 'kk',
      prefix: 'kiss',
      store: new Redis()
    })
  );
  // 解析json
  app.use(
    bodyparser({
      enableTypes: ['json', 'form', 'text']
    })
  );
  // token 验证token
  // token 验证失败拦截
  app.use(function(ctx, next) {
    return next().catch(error => {
      if (error.status === 401) {
        ctx.status = 401;
        ctx.body = {
          code: -1,
          msg: 'Protected resource, use Authorization header to get access\n'
        };
      }
    });
  });
  // 使用自定义API 接口路由
  app.use(city.routes()).use(city.allowedMethods());
  app.use(user.routes(), user.allowedMethods());
  app.use(login.routes(), login.allowedMethods());
  app.use(ctx => {
    ctx.status = 200; // koa defaults to 404 when it sees that status is unset

    return new Promise((resolve, reject) => {
      ctx.res.on('close', resolve);
      ctx.res.on('finish', resolve);
      nuxt.render(ctx.req, ctx.res, promise => {
        // nuxt.render passes a rejected promise into callback on error.
        promise.then(resolve).catch(reject);
      });
    });
  });

  app.listen(port, host);
  consola.ready({
    message: `大爷您的服务已经启动，具体可以查看 http://${host}:${port}`,
    badge: true
  });
  // 输出自定义风格logo风格字符串
  const str = Alphabet('CMS', 'planar');
  console.log(str);
}

start();
