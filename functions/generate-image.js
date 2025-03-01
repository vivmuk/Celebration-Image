// Use axios instead of fetch for better compatibility
const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { celebration, person, prompt } = body;
    
    // Validate inputs
    if (!celebration || !person || !prompt) {
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
    
    // Create a more specific prompt focusing on 70s Japanese adult anime style
    const enhancedPrompt = `1970s Japanese adult anime style image featuring adults celebrating a ${celebration} event. 
    Prominent decorative banner at the top of the image with the text "${greeting}" in bold, colorful lettering. 
    Vintage anime art style from the 1970s with vibrant colors, hand-drawn animation look, and simple backgrounds. 
    The banner should be very clear and readable at the top of the image.`;
    
    console.log("Generating image with prompt:", enhancedPrompt);
    
    // Create the API request payload without style_preset
    const payload = {
      model: "fluently-xl",
      prompt: enhancedPrompt,
      negative_prompt: "Clouds, Rain, Snow, Modern style, 3D, photorealistic, children, childish style, modern anime, detailed faces",
      height: 1024,
      width: 1024,
      steps: 30,
      cfg_scale: 8.0, // Slightly increased for more prompt adherence
      seed: Math.floor(Math.random() * 1000000),
      safe_mode: false,
      return_binary: false,
      hide_watermark: false
    };
    
    // Log the full request for debugging
    console.log("Full request payload:", JSON.stringify(payload));
    
    // Make the API call to Venice using axios
    const response = await axios({
      method: 'post',
      url: 'https://api.venice.ai/api/v1/image/generate',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    console.log("API Response Status:", response.status);
    console.log("API Response Data:", JSON.stringify(response.data, null, 2));
    
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
        error: 'Internal Server Error: ' + error.message
      })
    };
  }
}; 