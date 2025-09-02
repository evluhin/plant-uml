const jwt = require('jsonwebtoken');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

exports.handler = async function(event) {
  try {
    console.log('=== Lambda Handler Called ===');
    console.log('Event headers:', JSON.stringify(event.headers, null, 2));
    console.log('Event body:', event.body);
    
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return createErrorResponse(401, 'Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    console.log('Token received:', token.substring(0, 50) + '...');
    
    // Use dev secret for now (in production, use SSM)
    const jwtSecret = process.env.RENDERER_JWT_SECRET || 'dev-secret';
    console.log('Using JWT secret:', jwtSecret);
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      console.log('JWT verified successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return createErrorResponse(401, 'Invalid JWT token: ' + jwtError.message);
    }
    
    // Parse request body
    if (!event.body) {
      console.error('No request body provided');
      return createErrorResponse(400, 'Request body is required');
    }
    
    let request;
    try {
      request = JSON.parse(event.body);
      console.log('Request parsed successfully:', request);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate request
    if (!request.source?.trim()) {
      console.error('No source provided in request');
      return createErrorResponse(400, 'Source is required');
    }
    
    if (!['svg', 'png'].includes(request.format)) {
      console.error('Invalid format:', request.format);
      return createErrorResponse(400, 'Format must be svg or png');
    }
    
    console.log('Request validation passed. Source length:', request.source.length);
    
    // Render PlantUML diagram
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    console.log('Rendering PlantUML source:', request.source);
    
    let svgContent;
    try {
      svgContent = await renderPlantUML(request.source);
    } catch (renderError) {
      console.error('PlantUML rendering failed:', renderError);
      console.log('Using fallback SVG generation');
      // Fallback to simple SVG generation
      svgContent = generateFallbackSvg(request.source);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      },
      body: svgContent
    };
    
  } catch (error) {
    console.error('Render failed:', error);
    console.error('Error stack:', error.stack);
    return createErrorResponse(500, 'Rendering failed: ' + error.message);
  }
};

async function renderPlantUML(source) {
  return new Promise((resolve, reject) => {
    const tempDir = '/tmp';
    const timestamp = Date.now();
    const inputFile = path.join(tempDir, `input-${timestamp}.puml`);
    
    try {
      // Write source to temp file
      fs.writeFileSync(inputFile, source);
      console.log('Created input file:', inputFile);
      
      // Check if PlantUML jar exists
      const plantumlJar = '/opt/plantuml.jar';
      if (!fs.existsSync(plantumlJar)) {
        throw new Error('PlantUML jar not found at /opt/plantuml.jar');
      }
      
      // Run PlantUML
      const java = spawn('java', [
        '-jar', plantumlJar,
        '-tsvg',
        '-o', tempDir,
        inputFile
      ]);
      
      let stderr = '';
      let stdout = '';
      
      java.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      java.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      java.on('close', (code) => {
        try {
          console.log('PlantUML exit code:', code);
          console.log('PlantUML stdout:', stdout);
          console.log('PlantUML stderr:', stderr);
          
          // Clean up input file
          if (fs.existsSync(inputFile)) {
            fs.unlinkSync(inputFile);
          }
          
          if (code !== 0) {
            reject(new Error(`PlantUML failed with code ${code}: ${stderr}`));
            return;
          }
          
          // Read generated SVG
          const svgFile = inputFile.replace('.puml', '.svg');
          console.log('Looking for SVG file:', svgFile);
          
          if (fs.existsSync(svgFile)) {
            const svgContent = fs.readFileSync(svgFile, 'utf8');
            fs.unlinkSync(svgFile); // Clean up
            console.log('SVG generated successfully, length:', svgContent.length);
            resolve(svgContent);
          } else {
            reject(new Error('SVG file not generated at: ' + svgFile));
          }
        } catch (error) {
          reject(error);
        }
      });
      
      // Set timeout
      setTimeout(() => {
        java.kill();
        reject(new Error('PlantUML rendering timeout'));
      }, 30000);
      
    } catch (error) {
      reject(error);
    }
  });
}

function generateFallbackSvg(source) {
  console.log('Generating fallback SVG for source:', source.substring(0, 100));
  
  // Extract participants from PlantUML source
  const lines = source.split('\n');
  const participants = new Set();
  const interactions = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.includes('->')) {
      const parts = trimmed.split('->');
      if (parts.length >= 2) {
        const from = parts[0].trim();
        const rest = parts[1].trim();
        const colonIndex = rest.indexOf(':');
        const to = colonIndex > 0 ? rest.substring(0, colonIndex).trim() : rest.trim();
        const message = colonIndex > 0 ? rest.substring(colonIndex + 1).trim() : 'Message';
        
        participants.add(from);
        participants.add(to);
        interactions.push({ from, to, message });
      }
    }
  });
  
  const participantList = Array.from(participants);
  const width = Math.max(400, participantList.length * 150);
  const height = 200 + interactions.length * 50;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
      </marker>
    </defs>`;
  
  // Draw participants
  participantList.forEach((participant, i) => {
    const x = 50 + i * 150;
    const y = 30;
    svg += `
    <rect x="${x}" y="${y}" width="100" height="40" fill="#e1f5fe" stroke="#01579b" stroke-width="2" rx="5"/>
    <text x="${x + 50}" y="${y + 25}" text-anchor="middle" font-family="Arial" font-size="14" fill="#01579b">${participant}</text>
    <line x1="${x + 50}" y1="${y + 40}" x2="${x + 50}" y2="${height - 20}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`;
  });
  
  // Draw interactions
  interactions.forEach((interaction, i) => {
    const fromIndex = participantList.indexOf(interaction.from);
    const toIndex = participantList.indexOf(interaction.to);
    if (fromIndex >= 0 && toIndex >= 0) {
      const fromX = 50 + fromIndex * 150 + 50;
      const toX = 50 + toIndex * 150 + 50;
      const y = 100 + i * 50;
      
      svg += `
      <line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" stroke="#000" stroke-width="2" marker-end="url(#arrowhead)"/>
      <text x="${(fromX + toX) / 2}" y="${y - 5}" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">${interaction.message}</text>`;
    }
  });
  
  svg += '</svg>';
  console.log('Generated fallback SVG, length:', svg.length);
  return svg;
}

function createErrorSvg(errorMessage) {
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
    <text x="200" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#d32f2f">
      PlantUML Error: ${errorMessage.substring(0, 50)}...
    </text>
  </svg>`;
}

function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: message })
  };
}