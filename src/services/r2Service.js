// src/services/r2Service.js
// Serviço para integração com Cloudflare R2 via AWS SDK (S3 compatible)
const AWS = require('aws-sdk')

const r2 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT, // Ex: 'https://<accountid>.r2.cloudflarestorage.com'
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto', // Cloudflare recomenda 'auto'
  signatureVersion: 'v4',
})

const BUCKET = process.env.R2_BUCKET

module.exports = {
  uploadFile: async (key, body, contentType) => {
    return r2
      .upload({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
      .promise()
  },

  getFile: async (key) => {
    return r2
      .getObject({
        Bucket: BUCKET,
        Key: key,
      })
      .promise()
  },

  deleteFile: async (key) => {
    return r2
      .deleteObject({
        Bucket: BUCKET,
        Key: key,
      })
      .promise()
  },
}
