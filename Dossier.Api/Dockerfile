FROM mcr.microsoft.com/dotnet/sdk:10.0-preview
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o out
EXPOSE 8080
ENTRYPOINT ["dotnet", "out/Dossier.Api.dll"]