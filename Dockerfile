FROM node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee AS frontend-build
WORKDIR /src/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:bef136a371963aaa46ec97882845ef6f54dec15728bb4b128b1c2a400ffbc9b4 AS backend-build
WORKDIR /src

COPY src/DotnetTemplate.Api/DotnetTemplate.Api.csproj src/DotnetTemplate.Api/
RUN dotnet restore src/DotnetTemplate.Api/DotnetTemplate.Api.csproj

COPY src/DotnetTemplate.Api/ src/DotnetTemplate.Api/
RUN dotnet publish src/DotnetTemplate.Api/DotnetTemplate.Api.csproj -c Release -o /app/publish --no-restore

COPY --from=frontend-build /src/apps/frontend/dist/ /app/publish/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:12b1135f5f8b3c0a214f2a680ff2033dff4f684f445d6c697d9524ceeb303586 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=backend-build /app/publish ./

ENTRYPOINT ["dotnet", "DotnetTemplate.Api.dll"]
