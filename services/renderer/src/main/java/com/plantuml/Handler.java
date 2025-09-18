package com.plantuml;

// AWS Lambda handler for PlantUML rendering - CI/CD test
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.sourceforge.plantuml.SourceStringReader;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

public class Handler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    
    @Override
    public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent request, Context context) {
        try {
            // Log request details for debugging
            context.getLogger().log("Raw Path: " + request.getRawPath());
            context.getLogger().log("HTTP Method: " + request.getRequestContext().getHttp().getMethod());
            context.getLogger().log("Route Key: " + request.getRouteKey());
            
            String rawPath = request.getRawPath();
            String method = request.getRequestContext().getHttp().getMethod();
            
            // Extract path without stage (remove /dev, /prod, etc.)
            String path = rawPath;
            if (rawPath.startsWith("/dev/")) {
                path = rawPath.substring(4);
            } else if (rawPath.startsWith("/prod/")) {
                path = rawPath.substring(5);
            }
            
            context.getLogger().log("Processed Path: " + path);
            
            // Handle health check (no auth required)
            if ("/health".equals(path) && "GET".equals(method)) {
                return createHealthResponse();
            }
            
            // Handle render endpoint
            if ("/render".equals(path) && "POST".equals(method)) {
                return handleRenderRequest(request);
            }
            
            // Unsupported endpoint
            return createErrorResponse(404, "Endpoint not found");
            
        } catch (Exception e) {
            return createErrorResponse(500, "Internal server error: " + e.getMessage());
        }
    }
    
    private APIGatewayV2HTTPResponse handleRenderRequest(APIGatewayV2HTTPEvent request) {
        try {
            // Parse request body
            String body = request.getBody();
            if (body == null) {
                return createErrorResponse(400, "Request body is required");
            }
            
            Map<String, Object> requestData = objectMapper.readValue(body, Map.class);
            String source = (String) requestData.get("source");
            
            if (source == null || source.trim().isEmpty()) {
                return createErrorResponse(400, "Source is required");
            }
            
            // Set headless mode
            System.setProperty("java.awt.headless", "true");
            
            // Render PlantUML
            SourceStringReader reader = new SourceStringReader(source);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            reader.outputImage(outputStream, new FileFormatOption(FileFormat.SVG));
            String svgContent = outputStream.toString("UTF-8");
            
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "image/svg+xml");
            
            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(200)
                .withHeaders(headers)
                .withBody(svgContent)
                .build();
                
        } catch (Exception e) {
            return createErrorResponse(500, "Rendering failed: " + e.getMessage());
        }
    }
    
    private APIGatewayV2HTTPResponse createHealthResponse() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        
        String healthJson = "{\"status\":\"healthy\",\"timestamp\":\"" + 
            java.time.Instant.now().toString() + "\"}";
        
        return APIGatewayV2HTTPResponse.builder()
            .withStatusCode(200)
            .withHeaders(headers)
            .withBody(healthJson)
            .build();
    }
    
    private APIGatewayV2HTTPResponse createErrorResponse(int statusCode, String message) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        
        try {
            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody("{\"error\":\"" + message + "\"}")
                .build();
        } catch (Exception e) {
            return APIGatewayV2HTTPResponse.builder()
                .withStatusCode(500)
                .withBody("{\"error\":\"Internal error\"}")
                .build();
        }
    }
}