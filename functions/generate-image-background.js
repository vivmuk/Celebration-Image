// Use axios instead of fetch for better compatibility
const axios = require('axios');

// By naming this file with a "-background" suffix or placing it in a "background" directory,
// Netlify will treat it as a background function with a 15-minute timeout instead of 10 seconds
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
    
    // Your Venice API key - use environment variable if available
    const apiKey = process.env.VENICE_API_KEY || "ILVaW8hCvwU85eFHtKlvfMuXYe06x7oGuU_ZetEn3j";
    
    // Check if API key looks valid
    if (!apiKey || apiKey === "ILVaW8hCvwU85eFHtKlvfMuXYe06x7oGuU_ZetEn3j") {
      console.warn("Warning: Using default API key. This may not work properly. Please set your own API key as an environment variable.");
    }
    
    console.log("Making API call to Venice with greeting:", greeting);
    
    // Make the API call to Venice for image generation
    try {
      // Generate a unique timestamp and random number to prevent caching
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      console.log("Preparing to call Venice API with the following data:", JSON.stringify({
        model: "flux-dev",
        prompt_summary: "Heartwarming Miyazaki/Ghibli-inspired celebration with teal skies and yellow fields",
        height: 720,
        width: 1280,
        steps: 20, // Increased to 20 for higher quality images
        cfg_scale: 8, // Balanced setting for quality and speed
        seed: randomSeed
      }));
      
      // We can use a longer timeout now that we're a background function
      const veniceResponse = await axios({
        method: 'post',
        url: 'https://api.venice.ai/api/v1/image/generate',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Request-ID': `${timestamp}-${randomSeed}` // Add a unique request ID
        },
        data: {
          model: "flux-dev",
          prompt: `A heartwarming, hand-painted illustration in the distinctive style of Hayao Miyazaki and Studio Ghibli, celebrating ${celebration}. The scene should feature a bright teal blue sky with fluffy white clouds, vibrant yellow fields of flowers or grass, and rolling green mountains in the background. The illustration should feel dreamy, detailed, and immersive, with soft lighting and a serene, nostalgic atmosphere characteristic of Miyazaki's works.

At the very top of the image, there must be a large, bold, rectangular banner spanning the entire width. The banner should have a solid red background, and the text should be in bold, white, sans-serif font, centered clearly. The exact text on the banner must be: "${greeting}"

The text must be fully readable, properly aligned, and NOT obstructed by any elements in the scene.

The central character, ${person}, should be actively engaged in an activity that directly relates to the ${celebration} - the character should be the clear focus of the scene. They may be surrounded by friends, animals, or magical creatures typical of Miyazaki films. The landscape may include a winding path through the yellow fields, but this should be secondary to the celebration activity. The art style should have clean lines and vibrant colors, especially focusing on the teal blue sky, yellow fields, and green mountains. The mood should feel peaceful, joyful, and nostalgic, with the whimsical and magical quality that defines Studio Ghibli films.`,
          negative_prompt: "blurry, low quality, missing text, incorrect text, banner at bottom, 3D, photorealistic, missing banner, text unreadable, text cut off, banner too small, banner wrong color, dark colors, orange sky, brown fields, character not celebrating",
          height: 720,
          width: 1280,
          steps: 20, // Increased to 20 for higher quality images
          cfg_scale: 8, // Balanced setting for quality and speed
          seed: randomSeed,
          safe_mode: false,
          return_binary: false,
          hide_watermark: false
        },
        timeout: 120000 // 120 seconds (2 minutes) timeout for 20 steps
      });
      
      console.log("Venice API response status:", veniceResponse.status);
      console.log("Venice API response data structure:", Object.keys(veniceResponse.data));
      
      // Add more detailed logging
      if (veniceResponse.data) {
        console.log("Response data type:", typeof veniceResponse.data);
        console.log("Response has images property:", veniceResponse.data.hasOwnProperty('images'));
        if (veniceResponse.data.images) {
          console.log("Images array length:", veniceResponse.data.images.length);
        }
      }
      
      // Check if we have images in the response
      if (veniceResponse.data && veniceResponse.data.images && veniceResponse.data.images.length > 0) {
        console.log("Image found in response, image data length:", veniceResponse.data.images[0].length);
        const imageBase64 = veniceResponse.data.images[0];
        // The API returns base64 data, so we need to construct a data URL
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            imageUrl: imageUrl,
            greeting: greeting,
            message: "Image generated successfully!"
          })
        };
      } else {
        console.log("No images found in Venice API response. Full response:", JSON.stringify(veniceResponse.data));
        
        // Fallback to placeholder image
        const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}-${timestamp}/1280/720`;
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
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
        console.error("Venice API error response status:", apiError.response.status);
        console.error("Venice API error response data:", JSON.stringify(apiError.response.data));
        
        // Check for rate limiting (429 status code)
        if (apiError.response.status === 429) {
          console.log("Rate limit exceeded. You may need to wait before making more requests.");
        }
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error("Venice API no response received. Request:", apiError.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Venice API error setup:", apiError.message);
      }
      
      // Fallback to placeholder image
      const timestamp = Date.now();
      const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}-${timestamp}/1280/720`;
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
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
    const timestamp = Date.now();
    const placeholderImageUrl = `https://picsum.photos/seed/${timestamp}/1280/720`;
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        error: 'Failed to process request: ' + error.message,
        message: "Using a default placeholder image due to error."
      })
    };
  }
}; 