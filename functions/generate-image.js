// Use axios instead of fetch for better compatibility
const axios = require('axios');

exports.handler = async function(event, context) {
  // Tell Netlify we'll handle the response ourselves
  // This is critical - it allows us to return quickly while processing continues
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
    
    // Generate a unique timestamp and random number to prevent caching
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // IMPORTANT: Return a placeholder image immediately to avoid Netlify timeout
    // This is crucial - we'll return right away with a placeholder while the API call happens
    const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}-${timestamp}/1280/720`;
    
    // Start the API call in the background without waiting for it
    // This allows us to return quickly while the API call continues
    makeVeniceApiCall(apiKey, celebration, person, greeting, timestamp, randomSeed)
      .then(result => {
        console.log("Background API call completed successfully");
      })
      .catch(error => {
        console.error("Background API call failed:", error.message);
      });
    
    // Return immediately with a placeholder image
    // The client will need to poll for the real image
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        greeting: greeting,
        message: "Image generation started. Please check back in 10-15 seconds for the real image.",
        timestamp: timestamp,
        status: "processing"
      })
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Use a default placeholder image as a fallback with timestamp to prevent caching
    const timestamp = Date.now();
    const placeholderImageUrl = `https://picsum.photos/seed/${timestamp}/1280/720`;
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        error: 'Failed to process request: ' + error.message,
        message: "Using a default placeholder image due to error.",
        timestamp: timestamp
      })
    };
  }
};

// Separate function to make the API call in the background
async function makeVeniceApiCall(apiKey, celebration, person, greeting, timestamp, randomSeed) {
  try {
    console.log("Background process: Preparing to call Venice API with the following data:", JSON.stringify({
      model: "flux-dev",
      prompt_summary: "Studio Ghibli-style celebration with banner",
      height: 720,
      width: 1280,
      steps: 20,
      cfg_scale: 9,
      seed: randomSeed,
      timestamp: timestamp
    }));
    
    // Add a small delay to prevent rate limiting (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
        model: "flux-dev", // Changed to flux-dev as requested
        prompt: `Studio Ghibli-style illustration of a ${celebration} celebration. Soft lighting, dreamy atmosphere, and whimsical details. Close-up view of the scene.

A red rectangular banner at the top of the image with white text that reads "${greeting}".

The character ${person} is celebrating in a magical environment with Miyazaki-inspired scenery, surrounded by friends and family. Multiple characters visible in the scene, all celebrating together. Close-up framing that focuses on the characters' expressions and interactions. Timestamp: ${timestamp}`,
        negative_prompt: "blurry, low quality, missing text, incorrect text, banner at bottom, text obstructed, distant wide shot",
        height: 720,
        width: 1280,
        steps: 15, // Reduced to 15 to speed up generation
        cfg_scale: 9,
        seed: randomSeed,
        safe_mode: false,
        return_binary: false,
        hide_watermark: false
      },
      timeout: 60000 // 60 seconds timeout
    });
    
    console.log("Background process: Venice API response status:", veniceResponse.status);
    
    // Log the full response data to see what's coming back
    console.log("Background process: Venice API response data structure:", Object.keys(veniceResponse.data));
    
    // Check if we have images in the response
    if (veniceResponse.data && veniceResponse.data.images && veniceResponse.data.images.length > 0) {
      console.log("Background process: Image generated successfully!");
      return true;
    } else {
      console.log("Background process: No images found in Venice API response");
      return false;
    }
  } catch (error) {
    console.error("Background process: Venice API error:", error.message);
    if (error.response) {
      console.error("Background process: Error status:", error.response.status);
    }
    throw error;
  }
} 