# 70s Anime Celebration Generator

A fun web app that generates custom celebration images in a 70s anime style using the Venice AI API.

## Features

- Generate custom celebration images with your own greeting and name
- Beautiful 70s anime-style illustrations with Miyazaki/Ghibli influences
- Vibrant color palette with teal skies and yellow fields
- Red banner with your custom greeting text

## Deployment Instructions

### Prerequisites

- Node.js and npm installed
- A Netlify account
- A Venice AI API key

### Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   cd functions
   npm install
   ```
3. Create a `.env` file in the root directory with your Venice API key:
   ```
   VENICE_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```
   npx netlify dev
   ```

### Netlify Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Build command: `npm install && cd functions && npm install`
   - Publish directory: `.`
4. Add your Venice API key as an environment variable in Netlify:
   - Key: `VENICE_API_KEY`
   - Value: `your_api_key_here`
5. Deploy your site

## Important Files

- `index.html` - The main frontend file
- `functions/generate-image-background.js` - The Netlify background function that generates images
- `netlify.toml` - Configuration for Netlify deployment

## Troubleshooting

If you encounter issues with the image generation:

1. Check the Netlify function logs for errors
2. Ensure your Venice API key is correctly set
3. Verify that the background function is properly configured in `netlify.toml`
4. Check that axios is properly installed in the functions directory

## License

MIT 