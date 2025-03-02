// Use axios instead of fetch for better compatibility
const axios = require('axios');

exports.handler = async function(event, context) {
  // Tell Netlify not to close the function prematurely
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { celebration, person } = body;
    
    // Validate inputs
    if (!celebration || !person) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Construct the greeting - make sure to include both celebration and person
    const greeting = `${celebration} ${person}`;
    
    // Your Venice API key
    const apiKey = process.env.VENICE_API_KEY || "ILVaW8hCvwU85eFHtKlvfMuXYe06x7oGuU_ZetEn3j";
    
    console.log("Making API call to Venice with greeting:", greeting);
    
    // Make the API call to Venice for image generation
    try {
      // Simplified API call based on the example documentation
      const veniceResponse = await axios({
        method: 'post',
        url: 'https://api.venice.ai/api/v1/image/generate',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: "fluently-xl",
          prompt: `A heartwarming, hand-painted Studio Ghibli-style illustration celebrating ${celebration}. The scene should feel dreamy, detailed, and immersive, with soft lighting, lush environments, and a cozy, nostalgic atmosphere, characteristic of Hayao Miyazaki's iconic movies.

At the very top of the image, there must be a large, bold, rectangular banner spanning the entire width. The banner should have a solid red background, and the text should be in bold, white, sans-serif font, centered clearly. The exact text on the banner must be:

➡️ '${greeting}'

The text must be fully readable, properly aligned, and NOT obstructed by any elements in the scene.

The central character, ${person}, should be depicted engaging in an activity that reflects the celebration, surrounded by a magical, detailed environment filled with whimsical details, soft brush strokes, and rich color palettes typical of Studio Ghibli films. The mood should feel serene, joyful, and nostalgic, capturing the warmth and artistic richness of Miyazaki's works.`,
          negative_prompt: "blurry, low quality, missing text, incorrect text, misspelled text, wrong text, text that is hard to read, banner at bottom, multiple banners, split text, exaggerated features, large eyes, chibi style, wavy banner, decorative banner, banner in wrong position, text obstructed, anime style that is not Ghibli",
          height: 720,
          width: 1280,
          steps: 23,
          cfg_scale: 10.0,
          seed: Math.floor(Math.random() * 1000000),
          safe_mode: false,
          return_binary: false,
          hide_watermark: false
        },
        timeout: 60000 // 60 seconds timeout
      });
      
      console.log("Venice API response status:", veniceResponse.status);
      
      // Check if we have images in the response
      if (veniceResponse.data && veniceResponse.data.images && veniceResponse.data.images.length > 0) {
        const imageBase64 = veniceResponse.data.images[0];
        // The API returns base64 data, so we need to construct a data URL
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            imageUrl: imageUrl,
            greeting: greeting,
            message: "Image generated successfully!"
          })
        };
      } else {
        console.log("No images found in Venice API response:", JSON.stringify(veniceResponse.data));
        
        // Fallback to placeholder image
        const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}/1280/720`;
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            imageUrl: placeholderImageUrl,
            greeting: greeting,
            message: "Using a placeholder image. The Venice API did not return an image."
          })
        };
      }
    } catch (apiError) {
      console.error("Venice API error:", apiError.message);
      
      // If we have a response from the API, log it
      if (apiError.response) {
        console.error("Venice API error response:", JSON.stringify(apiError.response.data));
      }
      
      // Fallback to placeholder image
      const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}/1280/720`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          imageUrl: placeholderImageUrl,
          greeting: greeting,
          message: "Using a placeholder image. The Venice API returned an error: " + apiError.message
        })
      };
    }
  } catch (error) {
    console.error('Error:', error.message);
    
    // Use a default placeholder image as a fallback
    const placeholderImageUrl = `https://picsum.photos/1280/720`;
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        error: 'Failed to process request: ' + error.message,
        message: "Using a default placeholder image due to error."
      })
    };
  }
}; 