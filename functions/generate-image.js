// Serverless function to generate images using Venice API
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
      seed: Math.floor(Math.random() * 1000000), // Random seed for variety
      lora_strength: 50,
      safe_mode: false,
      return_binary: false,
      hide_watermark: false
    };
    
    // Make the API call to Venice
    const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    
    // Return the image URL to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        imageUrl: data.imageUrl || data.image_url || (data.images && data.images[0] ? data.images[0].url : null),
        error: data.error || null
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};
