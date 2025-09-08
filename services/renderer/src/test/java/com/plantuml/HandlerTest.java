package com.plantuml;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class HandlerTest {

    @Mock
    private Context context;

    private Handler handler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        handler = new Handler();
        
        // Set test environment
        System.setProperty("NODE_ENV", "development");
    }

    @Test
    void testHealthEndpoint() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setPath("/health");
        request.setHttpMethod("GET");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        assertEquals(200, response.getStatusCode());
        assertTrue(response.getBody().contains("healthy"));
    }

    @Test
    void testRenderEndpointWithValidInput() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setPath("/render");
        request.setHttpMethod("POST");
        request.setBody("{\"source\":\"@startuml\\nAlice -> Bob: Hello\\n@enduml\",\"format\":\"svg\"}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        assertEquals(200, response.getStatusCode());
        assertTrue(response.getBody().contains("<svg"));
    }

    @Test
    void testRenderEndpointWithInvalidInput() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setPath("/render");
        request.setHttpMethod("POST");
        request.setBody("{\"source\":\"\",\"format\":\"svg\"}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        assertEquals(400, response.getStatusCode());
    }

    @Test
    void testUnsupportedEndpoint() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        request.setPath("/unknown");
        request.setHttpMethod("GET");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        assertEquals(404, response.getStatusCode());
    }
}