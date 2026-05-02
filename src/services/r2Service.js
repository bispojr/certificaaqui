// src/services/r2Service.js
// Serviço para integração com Cloudflare R2 via AWS SDK (S3 compatible)
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')

const r2 = new S3Client({
  endpoint: process.env.R2_ENDPOINT, // Ex: 'https://<accountid>.r2.cloudflarestorage.com'
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  region: 'auto', // Cloudflare recomenda 'auto'
})

const BUCKET = process.env.R2_BUCKET

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

module.exports = {
  uploadFile: async (key, body, contentType) => {
    const upload = new Upload({
      client: r2,
      params: {
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    })
    return upload.done()
  },

  getFile: async (key) => {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const response = await r2.send(command)
    const body = await streamToBuffer(response.Body)
    return { Body: body }
  },

  deleteFile: async (key) => {
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    return r2.send(command)
  },
}
