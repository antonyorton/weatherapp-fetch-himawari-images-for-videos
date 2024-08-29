//a module to fetch or push data to an S3 bucket
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')
require('dotenv').config()
// const { loadImage } = require('canvas')

// create an S3 client
const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
  }
})

// Fetch all image files from S3 bucket
async function fetchImagesFromS3(bucketName) {
  const images = []
  for (const objectKey of objectKeys) {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
    const response = await s3Client.send(command)
    // const image = await loadImage(response.Body)
    // images.push(image)
    images.push(response.Body)
  }
  return images
}

//list all objects in a bucket
async function listAllObjectsInBucket(bucketName) {
  const params = {
    Bucket: bucketName
  }

  const objects = []
  let isTruncated = true
  let continuationToken = null

  try {
    while (isTruncated) {
      if (continuationToken) {
        params.ContinuationToken = continuationToken
      }

      const data = await s3Client.send(new ListObjectsV2Command(params))
      objects.push(...data.Contents)

      isTruncated = data.IsTruncated
      continuationToken = data.NextContinuationToken
    }
  } catch (error) {
    console.error('Error listing objects: ', error)
  }

  return objects
}

//function to push image to S3 bucket, does not seem to work with stream  [file type 'image/jpg']
async function pushToS3(data, objectKey, type) {
  try {
    // create a PutObjectCommand to upload data to S3 bucket
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: objectKey,
      Body: data,
      ContentType: type
    })

    // execute the command
    const response = await s3Client.send(command)
    // console.log('Data pushed to S3 successfully:', data[data.length - 1])
  } catch (error) {
    console.error('Error pushing data to S3:', error)
  }
}

//fetch json data from S3
const fetchFromS3 = async objectKey => {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.MY_AWS_BUCKET_NAME,
        Key: objectKey
      })
    )
    const data = JSON.parse(await streamToString(response.Body))
    // console.log('Data fetched from S3:', data[data.length - 1])
    return data
  } catch (error) {
    console.error('Error fetching data from S3:', error)
    return []
  }
}

//helper function to convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

// const myBucket = process.env.MY_AWS_BUCKET_NAME
// const myFolder = 'weather-data/satellite/public-images/aus_snd_/'

// listAllObjectsInBucket(myBucket).then(objects => {
//   objects.forEach((key, i) => {
//     const keystring = key.Key
//     keystring.includes(myFolder) && console.log('key ', i, ': ', key.Key)
//   })
//   return
// })

module.exports = { pushToS3, fetchFromS3, fetchImagesFromS3, listAllObjectsInBucket }
