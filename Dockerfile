FROM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS frontend-build
WORKDIR /src/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:212fe4cb74627d5adf9817a4088906ae3edff1bd853bb27565d4b46731efe61e AS backend-build
WORKDIR /src

COPY src/DotnetTemplate.Api/DotnetTemplate.Api.csproj src/DotnetTemplate.Api/
RUN dotnet restore src/DotnetTemplate.Api/DotnetTemplate.Api.csproj

COPY src/DotnetTemplate.Api/ src/DotnetTemplate.Api/
RUN dotnet publish src/DotnetTemplate.Api/DotnetTemplate.Api.csproj -c Release -o /app/publish --no-restore

COPY --from=frontend-build /src/apps/frontend/dist/ /app/publish/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:1a48394b6f29d3a32c79d9edecd4abda0ecbe8776d567dbfc4590ed6979c740c AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=backend-build /app/publish ./

ENTRYPOINT ["dotnet", "DotnetTemplate.Api.dll"]
