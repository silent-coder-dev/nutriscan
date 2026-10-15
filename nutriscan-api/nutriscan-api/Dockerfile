# syntax=docker/dockerfile:1

# ---------- 1) Build stage: compile the Spring Boot JAR ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Download dependencies first, so this layer is cached while only source code changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests need a database, so they run locally / in CI rather than inside the image build
RUN mvn -B -q package -DskipTests

# ---------- 2) Run stage: small JRE image with just the JAR ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Don't run as root inside the container
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app

# Tuned for small free-tier containers (e.g. 512 MB on Render):
#  - heap = 70% of the container's memory limit
#  - Serial GC: lowest memory overhead
#  - C1-only JIT: faster startup on a slow shared CPU
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"

# The app reads PORT (Render sets it); 8080 is the local default
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
