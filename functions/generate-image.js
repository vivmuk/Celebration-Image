const fetch = require('node-fetch');

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
    console.log("Generating image with prompt:", prompt);
    
    // Create the API request payload
    const payload = {
      model: "fluently-xl",
      prompt: prompt,
      negative_prompt: "Clouds, Rain, Snow, Modern style, 3D, photorealistic",
      style_preset: "70s Japanese Anime",
      height: 1024,
      width: 1024,
      steps: 30,
      cfg_scale: 7.5,
      seed: Math.floor(Math.random() * 1000000),
      lora_strength: 50,
      safe_mode: false,
      return_binary: false,
      hide_watermark: false
    };
    
    // Log the full request for debugging
    console.log("Full request payload:", JSON.stringify(payload));
    
    // Make the API call to Venice
    const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Get the response as text first for debugging
    const responseText = await response.text();
    console.log("Raw API Response:", responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { error: "Could not parse response as JSON", rawResponse: responseText };
    }
    
    console.log("Parsed API Response:", JSON.stringify(data, null, 2));
    
    // Return the image URL or error to the client
    return {
      statusCode: response.status,
      body: JSON.stringify({ 
        imageUrl: data.imageUrl || data.image_url || (data.images && data.images[0] ? data.images[0].url : null),
        error: data.error || null,
        status: response.status,
        statusText: response.statusText,
        details: "Please check the API key and Venice API documentation."
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error: ' + error.message,
        stack: error.stack
      })
    };
  }
}; 