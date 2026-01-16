# Simple static HTML hosting with nginx
FROM nginx:alpine

# Copy our hello world HTML file to nginx's default serving directory
COPY hello.html /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# nginx will start automatically as the default command
