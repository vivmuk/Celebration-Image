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
    
    // Log the API key (first few characters only for security)
    const apiKey = "ILVaW8hCvwU85eFHtKlvfMuXYe06x7oGuU_ZetEn3j"; // Hardcoded for testing
    console.log("Using API key directly in function for testing");
    
    // Construct the greeting
    const greeting = `${celebration} ${person}`;
    
    // Create a very simple prompt
    const enhancedPrompt = `Anime style. "${greeting}" banner.`;
    
    console.log("Generating image with prompt:", enhancedPrompt);
    
    // Create a minimal API request payload
    const payload = {
      model: "fluently-xl",
      prompt: enhancedPrompt,
      height: 512,  // Smaller size for faster generation
      width: 512    // Smaller size for faster generation
    };
    
    console.log("Full request payload:", JSON.stringify(payload));
    
    // Make the API call to Venice using axios with a longer timeout
    const response = await axios({
      method: 'post',
      url: 'https://api.venice.ai/api/v1/image/generate',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 25000  // 25 seconds timeout
    });
    
    console.log("API Response Status:", response.status);
    console.log("API Response Data:", JSON.stringify(response.data, null, 2));
    
    // Extract the image URL from the response
    let imageUrl = null;
    
    // Check all possible locations for the image URL
    if (response.data) {
      if (response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.data.image_url) {
        imageUrl = response.data.image_url;
      } else if (response.data.images && response.data.images.length > 0) {
        if (response.data.images[0].url) {
          imageUrl = response.data.images[0].url;
        } else if (typeof response.data.images[0] === 'string') {
          imageUrl = response.data.images[0];
        }
      } else if (response.data.output && response.data.output.length > 0) {
        imageUrl = response.data.output[0];
      }
    }
    
    console.log("Extracted Image URL:", imageUrl);
    
    if (!imageUrl) {
      console.error("Could not find image URL in response:", response.data);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Could not find image URL in API response',
          rawResponse: response.data
        })
      };
    }
    
    // Return the image URL to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        imageUrl: imageUrl,
        rawResponse: response.data
      })
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED') {
      return {
        statusCode: 504,
        body: JSON.stringify({ 
          error: 'The image is taking longer than expected to generate. Please try again.'
        })
      };
    }
    
    // Check if it's an API error with a response
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
      
      return {
        statusCode: error.response.status,
        body: JSON.stringify({ 
          error: 'API Error: ' + (error.response.data.error || error.response.statusText),
          details: error.response.data
        })
      };
    }
    
    // Otherwise return a generic error
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate image: ' + error.message
      })
    };
  }
}; 