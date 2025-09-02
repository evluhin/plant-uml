package com.plantuml;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.sourceforge.plantuml.SourceStringReader;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
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
            
            return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(headers)
                .withBody(svgContent);
                
        } catch (Exception e) {
            return createErrorResponse(500, "Rendering failed: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent createErrorResponse(int statusCode, String message) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        
        try {
            return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody("{\"error\":\"" + message + "\"}");
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent()
                .withStatusCode(500)
                .withBody("{\"error\":\"Internal error\"}");
        }
    }
}