FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 

FROM node:22-alpine
RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/dist /app/dist 
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]