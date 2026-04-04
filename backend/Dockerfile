FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl

# Create a non-root group and user for security
RUN addgroup -S bootgroup && adduser -S bootuser -G bootgroup

WORKDIR /app

# Create necessary directories for volumes and set ownership
RUN mkdir -p /app/logs /app/uploads && \
    chown -R bootuser:bootgroup /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Use the non-root user for execution
USER bootuser

EXPOSE 8080

# Use exec form for ENTRYPOINT to correctly handle SIGTERM/SIGINT signals
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
