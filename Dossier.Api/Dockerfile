FROM mcr.microsoft.com/dotnet/sdk:10.0-preview
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o out
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "out/Dossier.Api.dll"]