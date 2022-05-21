const OSS = require('ali-oss')
const path = require('path')
const Async = require('async');
const fs = require('fs');

class WebpackUploadOssPlugin {
    ossConfig = {
        accessKeyId: "",
        accessKeySecret: "",
        bucket: "",
        region: "",
        bucketPath: '',
        enable: true
    }
    constructor(config) {
        if (config) {
            this.ossConfig = config;
            return ;
        }
        fs.readFile(path.resolve('uploadOss.config.json'), 'utf8', (err, data) => {
            if (err) {
                this.ossConfig = null;
                return;
            }

            this.ossConfig = Object.assign(this.ossConfig,JSON.parse(data));
        })
    }
    apply (compiler) {
        const _this = this;
        compiler.hooks.afterEmit.tapAsync('upload-oss', (compilation, callback) => {
            if (!this.ossConfig || !this.ossConfig.enable) {
                return ;
                callback();
            }
            const outputPath = compilation.compiler.outputPath;
            const client = new OSS(this.ossConfig);
            const headers = [{
                allowedOrigin: '*',
                allowedMethod: 'GET',
                allowedHeader: '*',
                exposeHeader: 'Content-Length',
                maxAgeSeconds: '3600'
            }];
            const promises = [];
            for (const filePathName in compilation.assets) {
                promises.push(async function () {
                    const result = await client.put(`${_this.ossConfig.bucketPath}${filePathName}`, path.normalize(`${outputPath}/${filePathName}`), { headers });
                    if (result && result.url) {
                        console.log(`文件${filePathName}上传成功`)
                    }
                    return (result && result.url) || ''
                })
            }
            Async.eachSeries(promises, async function (item) {
                await item();
            }, function (err) {
                callback();
            });
        })
    }
}
module.exports = WebpackUploadOssPlugin;