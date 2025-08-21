import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { verifyJWTLocal } from '../utils/jwt-mock';
import { renderPlantUMLLocal } from '../utils/plantuml-mock';
import { RenderRequest, RenderResponse } from '../types';

const logger = new Logger({ serviceName: 'plantuml-renderer' });
const metrics = new Metrics({ namespace: 'PlantUML/Renderer' });

let isColdStart = true;

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  const coldStart = isColdStart;
  isColdStart = false;
  
  try {
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    await verifyJWTLocal(token);
    
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }
    
    let request: RenderRequest;
    try {
      request = JSON.parse(event.body) as RenderRequest;
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate request
    if (!request.source?.trim()) {
      return createErrorResponse(400, 'Source is required');
    }
    
    if (!['svg', 'png'].includes(request.format)) {
      return createErrorResponse(400, 'Format must be svg or png');
    }
    
    // Size limit check
    if (request.source.length > 200 * 1024) {
      return createErrorResponse(400, 'Source too large (max 200KB)');
    }
    
    // Log request (without source for security)
    logger.info('Render request received', {
      format: request.format,
      theme: request.theme,
      sourceLength: request.source.length,
      coldStart
    });
    
    // Render diagram
    const renderStartTime = Date.now();
    const result = await renderPlantUMLLocal(request.source, {
      format: request.format,
      ...(request.theme && { theme: request.theme })
    });
    const renderTime = Date.now() - renderStartTime;
    
    // Prepare response
    const response: RenderResponse = {
      metrics: {
        renderMs: renderTime,
        coldStart
      }
    };
    
    if (request.format === 'svg') {
      response.svg = result.toString('utf-8');
    } else {
      response.pngBase64 = result.toString('base64');
    }
    
    // Record metrics
    metrics.addMetric('RenderDuration', MetricUnits.Milliseconds, renderTime);
    metrics.addMetric('ColdStart', MetricUnits.Count, coldStart ? 1 : 0);
    metrics.addMetric('Success', MetricUnits.Count, 1);
    
    const totalTime = Date.now() - startTime;
    logger.info('Render completed successfully', {
      renderTimeMs: renderTime,
      totalTimeMs: totalTime,
      outputSize: result.length,
      format: request.format
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Render failed', { 
      error: errorMessage,
      coldStart,
      duration: Date.now() - startTime
    });
    
    metrics.addMetric('Error', MetricUnits.Count, 1);
    
    return createErrorResponse(500, 'Rendering failed');
  } finally {
    metrics.publishStoredMetrics();
  }
}

function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: message })
  };
}