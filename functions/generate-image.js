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
        prompt_summary: "Studio Ghibli-style celebration with banner",
        height: 720,
        width: 1280,
        steps: 10, // Reduced to 10 to fit within Netlify's timeout
        cfg_scale: 9,
        seed: randomSeed
      }));
      
      // Optimize the API call to complete faster
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
          prompt: `Studio Ghibli-style illustration of a ${celebration} celebration. Soft lighting, dreamy atmosphere, and whimsical details.

A red rectangular banner at the top of the image with white text that reads "${greeting}".

The character ${person} is celebrating in a magical environment with Miyazaki-inspired scenery, surrounded by friends and family.`,
          negative_prompt: "blurry, low quality, missing text, incorrect text, banner at bottom",
          height: 720,
          width: 1280,
          steps: 10, // Reduced to 10 to fit within Netlify's timeout
          cfg_scale: 9,
          seed: randomSeed,
          safe_mode: false,
          return_binary: false,
          hide_watermark: false
        },
        timeout: 9000 // 9 seconds timeout to ensure we don't hit Netlify's 10s limit
      });
      
      console.log("Venice API response status:", veniceResponse.status);
      console.log("Venice API response data structure:", Object.keys(veniceResponse.data));
      
      // Check if we have images in the response
      if (veniceResponse.data && veniceResponse.data.images && veniceResponse.data.images.length > 0) {
        console.log("Image found in response, image data length:", veniceResponse.data.images[0].length);
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
        console.log("No images found in Venice API response. Full response:", JSON.stringify(veniceResponse.data));
        
        // Fallback to placeholder image
        const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}-${timestamp}/1280/720`;
        
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
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        error: 'Failed to process request: ' + error.message,
        message: "Using a default placeholder image due to error."
      })
    };
  }
}; 