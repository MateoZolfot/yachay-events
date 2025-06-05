# Usar una imagen base de Node.js (LTS - Long Term Support)
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de definición de dependencias
# Copiamos package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm install

# Copiar el resto del código de la aplicación al directorio de trabajo
# Esto se hará después de npm install para aprovechar el caché de Docker si solo cambia el código
COPY . .
# Si tu código fuente está en una subcarpeta 'src', podrías hacer:
# COPY src ./src

# Exponer el puerto en el que la aplicación se ejecutará (debe coincidir con el PORT en docker-compose.yml)
EXPOSE 3001

# Comando para ejecutar la aplicación cuando el contenedor se inicie
CMD [ "node", "src/server.js" ]
# O si usas nodemon para desarrollo: CMD [ "npm", "run", "dev" ] (requiere nodemon en package.json)