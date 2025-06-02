#!/bin/bash

# Configuration
IMAGE_NAME="backend-stonkverse"
DOCKER_USERNAME="aegis336"  # Replace with your Docker Hub username
VERSION="latest"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Docker build process...${NC}"
# Clean up old images
echo -e "${GREEN}Cleaning up old images...${NC}"
docker rmi ${IMAGE_NAME}:${VERSION} 2>/dev/null || true
docker rmi ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} 2>/dev/null || true

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker buildx create --use
docker buildx build --platform linux/arm64/v8 -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} --push .
# docker buildx build --platform linux/arm64/v8 -t aegis336/backend-stonkverse:latest --push .
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi

# Tag the image
echo -e "${GREEN}Tagging image...${NC}"
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker tag failed!${NC}"
    exit 1
fi

# Push the image
echo -e "${GREEN}Pushing image to Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker push failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully built and pushed Docker image!${NC}"
echo -e "${GREEN}Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"