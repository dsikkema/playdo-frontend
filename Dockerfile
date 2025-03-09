FROM nginx:alpine

# Copy your built files
COPY dist/ /usr/share/nginx/html/

# Copy the startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Nginx runs on port 80
EXPOSE 80

# Run the entrypoint script when the container starts
ENTRYPOINT ["/entrypoint.sh"]
