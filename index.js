//AWS lambda function - working (production) on 7 July 2024
const { get_times, get_images_for_given_times } = require('./fetch_public_images_and_send_to_S3.js')
const { image_codes } = require('./jma_image_codes.js')

async function handler(event) {
  try {
    const times = get_times()
    await get_images_for_given_times(image_codes[event.image_code], times, (bucket_dir = 'weather-data/satellite/public-images'))
    console.log('Image fetch and push to S3 completed')
    const response = {
      statusCode: 200,
      body: JSON.stringify(`Successful fetch and push to S3 on ${new Date()}`)
    }
    return response
  } catch (err) {
    console.log(err)
  }
}

// handler({ image_code: 'tga_snd' })

module.exports = { handler }
