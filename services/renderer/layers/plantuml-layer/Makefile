build-PlantUMLLayer:
	mkdir -p "$(ARTIFACTS_DIR)/opt"
	
	# Download PlantUML JAR
	curl -L -o "$(ARTIFACTS_DIR)/opt/plantuml.jar" \
		"https://github.com/plantuml/plantuml/releases/download/v1.2024.0/plantuml-1.2024.0.jar"
	
	# Download static Graphviz binary for Linux x86_64
	mkdir -p "$(ARTIFACTS_DIR)/opt/bin"
	
	# Download pre-compiled static dot binary
	curl -L -o "$(ARTIFACTS_DIR)/opt/bin/dot" \
		"https://github.com/gvlx/graphviz-build-utilities/releases/download/2.50.0/dot-static-linux-x86_64"
	
	# Make executable
	chmod +x "$(ARTIFACTS_DIR)/opt/bin/dot"
	
	# Create fonts directory
	mkdir -p "$(ARTIFACTS_DIR)/opt/fonts"
	
	@echo "PlantUML layer built successfully"