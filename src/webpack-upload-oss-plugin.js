const OSS = require('ali-oss')
const path = require('path')
const Async = require('async');
const fs = require('fs');
const ProgressBar = require('./ProgressBar');
const projectDir = path.join(__dirname, '../../../');
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
        let _config = null;
        try {
            _config = require(`${projectDir}uploadOss.config.js`);
        } catch (err) {
            console.log(`${path.resolve(projectDir, 'uploadOss.config')}路径可能没有找到`)
        }
        this.ossConfig = Object.assign(this.ossConfig,_config);
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
            const pb = new ProgressBar('上传进度', 50);
            let num = 0, total = Object.keys(compilation.assets).length;
            for (const filePathName in compilation.assets) {
                promises.push(async function () {
                    const result = await client.put(`${_this.ossConfig.bucketPath}${filePathName}`, path.normalize(`${outputPath}/${filePathName}`), {
                        headers: {
                            "x-oss-object-acl": "public-read-write",
                            ...headers
                        }
                    });
                    if (result && result.url) {
                        num++;
                        if (num <= total) {
                            // 更新进度条
                            pb.render({ completed: num, total, info: result.url });

                        }
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