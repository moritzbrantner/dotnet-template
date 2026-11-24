FROM node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee AS frontend-build
WORKDIR /src/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:8c6edfb26c85153f236d26efebd9ad349aec403583f343f201ee67838b23658d AS backend-build
WORKDIR /src

COPY src/DotnetTemplate.Api/DotnetTemplate.Api.csproj src/DotnetTemplate.Api/
RUN dotnet restore src/DotnetTemplate.Api/DotnetTemplate.Api.csproj

COPY src/DotnetTemplate.Api/ src/DotnetTemplate.Api/
RUN dotnet publish src/DotnetTemplate.Api/DotnetTemplate.Api.csproj -c Release -o /app/publish --no-restore

COPY --from=frontend-build /src/apps/frontend/dist/ /app/publish/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:aac50ceef10391e78a899e3d2ccd00bbafa2dcb56ccf4586cbccf00edb84fc21 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=backend-build /app/publish ./

ENTRYPOINT ["dotnet", "DotnetTemplate.Api.dll"]
