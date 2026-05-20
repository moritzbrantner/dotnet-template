FROM node:22-bookworm-slim AS frontend-build
WORKDIR /src/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

COPY src/DotnetTemplate.Api/DotnetTemplate.Api.csproj src/DotnetTemplate.Api/
RUN dotnet restore src/DotnetTemplate.Api/DotnetTemplate.Api.csproj

COPY src/DotnetTemplate.Api/ src/DotnetTemplate.Api/
RUN dotnet publish src/DotnetTemplate.Api/DotnetTemplate.Api.csproj -c Release -o /app/publish --no-restore

COPY --from=frontend-build /src/apps/frontend/dist/ /app/publish/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=backend-build /app/publish ./

ENTRYPOINT ["dotnet", "DotnetTemplate.Api.dll"]
