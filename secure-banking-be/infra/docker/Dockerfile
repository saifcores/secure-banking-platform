FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ARG JAR
COPY ${JAR} app.jar
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
