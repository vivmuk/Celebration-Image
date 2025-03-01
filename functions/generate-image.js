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
    
    try {
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
      
      // For debugging, log the entire response structure
      console.log("Full response structure:", Object.keys(response.data));
      
      // Since the Venice API is not returning a valid image URL, let's use a placeholder image
      // This is a temporary solution until we can fix the API integration
      const placeholderImageUrl = `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(greeting)}`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          imageUrl: placeholderImageUrl,
          message: "Using a placeholder image for now. The Venice API integration needs further debugging.",
          rawResponse: response.data
        })
      };
      
    } catch (apiError) {
      console.error("API call failed:", apiError.message);
      
      // If the API call fails, use a placeholder image
      const placeholderImageUrl = `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(greeting)}`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          imageUrl: placeholderImageUrl,
          error: "API call failed: " + apiError.message,
          message: "Using a placeholder image due to API error."
        })
      };
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Use a placeholder image as a fallback
    const greeting = "Error";
    const placeholderImageUrl = `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(greeting)}`;
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        error: 'Failed to generate image: ' + error.message,
        message: "Using a placeholder image due to error."
      })
    };
  }
}; 