# Build

Requires multiplatform build. Macos has QEMU installed already, you may need to set up QEMU yourself on other systems.
```bash
npm run build
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/dsikkema/playdo-frontend:latest -t ghcr.io/dsikkema/playdo-frontend:<latest version number> --push .
```


# Run
It has to have an environment variable pointing to the backend.
```bash
docker run --name my_playdo_frontend -e BACKEND_URL=<backend-url>:5000 -d -p 80:80   ghcr.io/dsikkema/playdo-frontend:latest
```

Note about backend url env var: the entry point to the docker container will write that URL into the config.js file, which is used to statically serve
that url. This way, the backend url doesn't need to be baked into the image, but can still be served statically from inside the running docker container.
