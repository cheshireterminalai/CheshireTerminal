import Replicate from 'replicate'
import dotenv from 'dotenv'
dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: 'https://www.npmjs.com/package/create-replicate'
})
const model = 'black-forest-labs/flux-1.1-pro-ultra:352185dbc99e9dd708b78b4e6870e3ca49d00dc6451a32fc6dd57968194fae5a'
const input = {
  raw: false,
  prompt: 'a majestic snow-capped mountain peak bathed in a warm glow of the setting sun',
  aspect_ratio: '3:2',
  output_format: 'jpg',
  safety_tolerance: 2,
  image_prompt_strength: 0.1,
}

console.log('Using model: %s', model)
console.log('With input: %O', input)

console.log('Running...')
const output = await replicate.run(model, { input })
console.log('Done!', output)
