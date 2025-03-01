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
    
    // Construct the greeting
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
          prompt: `A 70s anime style illustration showing a "${celebration}" celebration scene with characters. Include a banner with text "${greeting}" in retro font. Use vibrant colors typical of 1970s anime.`,
          negative_prompt: "blurry, low quality",
          height: 720,
          width: 1280,
          steps: 15,
          cfg_scale: 7.5,
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