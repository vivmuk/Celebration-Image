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
    
    // Use a reliable placeholder image service
    // Using Lorem Picsum which is very reliable
    const placeholderImageUrl = `https://picsum.photos/seed/${encodeURIComponent(greeting)}/512/512`;
    
    console.log("Using placeholder image URL:", placeholderImageUrl);
    
    // Try to make a test API call to Venice just to log the response
    try {
      const apiKey = "ILVaW8hCvwU85eFHtKlvfMuXYe06x7oGuU_ZetEn3j";
      const testResponse = await axios({
        method: 'get',
        url: 'https://api.venice.ai/api/v1/models',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 5000
      });
      
      console.log("Venice API test response:", testResponse.status);
    } catch (testError) {
      console.log("Venice API test failed:", testError.message);
    }
    
    // Return the placeholder image URL
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        message: "Using a placeholder image for now. The Venice API integration needs further debugging.",
        greeting: greeting
      })
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Use a default placeholder image as a fallback
    const placeholderImageUrl = `https://picsum.photos/512/512`;
    
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