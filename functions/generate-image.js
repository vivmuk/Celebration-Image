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
    const apiKey = process.env.VENICE_API_KEY || '';
    console.log("API Key first 5 chars:", apiKey.substring(0, 5));
    console.log("API Key length:", apiKey.length);
    
    // Construct the greeting
    const greeting = `${celebration} ${person}`;
    
    // Create a prompt that balances detail with simplicity
    const enhancedPrompt = `1970s Japanese anime style image. Adults celebrating with a "${greeting}" banner at the top. Vintage hand-drawn animation look with vibrant colors.`;
    
    console.log("Generating image with prompt:", enhancedPrompt);
    
    // Create a simplified API request payload
    const payload = {
      model: "fluently-xl",
      prompt: enhancedPrompt,
      negative_prompt: "children, modern style, 3D, photorealistic",
      height: 1024,
      width: 1024,
      steps: 25  // Reduced steps for faster generation
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
    
    // Return the image URL or error to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        imageUrl: response.data.imageUrl || response.data.image_url || 
                 (response.data.images && response.data.images[0] ? response.data.images[0].url : null),
        error: response.data.error || null
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