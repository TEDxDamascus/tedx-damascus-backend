#! build stage  
FROM node:20-alpine AS build 

#  here im determining the directory of my nest app in the container
WORKDIR /app

#  copying the json packages file 
COPY package*.json .

# installing the dependencies

RUN npm install -g pnpm

RUN pnpm install 

# copying the source code 
COPY . .

# we must build the application 

RUN npm run build 

#! production stage
FROM node:20-alpine 

# now we are in the same app as previous stage 

WORKDIR /app

#  now we will copy the node_modules the result of the previous stage
COPY --from=build /app/node_modules ./node_modules 

# copying the result of building 
COPY --from=build /app/dist ./dist

EXPOSE 3000 

CMD [ "node","dist/main.js" ]






# QUESTIONS 
# dose the app the same in the two stages ?
# where do i specify the env-file in the build command right , if im passing it in the compose , do i need to specify it in the dockerfile ?
