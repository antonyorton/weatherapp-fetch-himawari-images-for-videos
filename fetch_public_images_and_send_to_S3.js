// working program which fetches images from the JMA website
// from the web url similar to    https://www.data.jma.go.jp/mscweb/data/himawari/img/fd_/fd__cve_0000.jpg
// and saves them to an S3 bucket in a format suitable for creation of videos using ffmpeg (by other program)
const axios = require('axios')
require('dotenv').config()
const { pushToS3 } = require('./s3_fetch_and_push.js')
// const { image_codes } = require('./jma_image_codes.js') //import for testing of basic functionality only

//function to create a set of times in format hhmm from the current UTC hour plus 1 to the current UTC hour plus 24
function get_times() {
  const times = []
  const currentUTC = new Date().getUTCHours()
  for (let h = currentUTC + 1; h < currentUTC + 25; h++) {
    for (let m = 0; m < 60; m += 10) {
      //take h modulo 24 to get the time in the range 00 to 23
      let h_mod24 = h % 24
      times.push(`${h_mod24.toString().padStart(2, '0')}${m.toString().padStart(2, '0')}`)
    }
  }
  return times
}

//fetch images for each time using async iterator
async function get_images_for_given_times(selected_dataset, times, bucket_dir = 'weather-data/satellite/public-images') {
  let successfulSaves = 0
  for await (const time of times) {
    await sleep(300)
    console.log('attempting image for ' + time)
    try {
      const response = await fetch_and_save_image(selected_dataset, time, successfulSaves, bucket_dir)
      if (response === 'saved') {
        successfulSaves++
      }
    } catch (error) {
      console.log('error fetching image for ' + time, '  Error: ', error.message)
    }
  }
}

//fetch and save image to S3
async function fetch_and_save_image(selected_dataset, time, successfulSaves, bucket_dir = 'weather-data/satellite/public-images') {
  const url = new URL('https://www.data.jma.go.jp')
  url.pathname = `/mscweb/data/himawari/img/${selected_dataset.areacode}/${selected_dataset.image_code}${time}.jpg`
  // special case for tga code
  if (selected_dataset.areacode === 'tga') {
    url.pathname = `/mscweb/data/himawari/img/${selected_dataset.areacode}/${selected_dataset.image_code}${time}_1.jpg`
  }

  // Save name details
  // Update the suffix based on the number of successful saves
  const suffix_text = String(successfulSaves + 1).padStart(4, '0')
  const savename = `${selected_dataset.image_code}${suffix_text}.jpg`
  // S3 object key to save image
  const objectKey = `${bucket_dir}/${selected_dataset.image_code}/${savename}`

  try {
    //fetch image
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
    //push to S3 bucket
    await pushToS3(response.data, objectKey, 'image/jpg')
    //return a promise to indicate a successful save and enable incrementation of successfulSaves
    return new Promise((resolve, reject) => {
      console.log(`Successfully saved: ${savename}`)
      resolve('saved')
    })
  } catch (error) {
    console.log('image not saved for:  ', time, '  Error: ', error.message)
  }
}

//sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// testing of basic functionality
// const times = get_times()
// const datasets = ['aus_snd', 'pi3_snd', 'jpn_snd']
// get_images_for_given_times(image_codes['aus_snd'], times.slice(0, 10), (bucket_dir = 'weather-data/satellite/public-images')).then(() => console.log('complete'))

module.exports = { get_times, get_images_for_given_times }
