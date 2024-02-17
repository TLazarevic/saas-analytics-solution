FROM eclipse-temurin:11

COPY --from=metabase/metabase:v0.48.6 /app /app

RUN mkdir -p /app/plugins
RUN chown 501:20 /app/plugins && chmod 770 /app/plugins

RUN useradd -ms /bin/sh metabase && chown -R metabase /app
WORKDIR /app
USER metabase

ENTRYPOINT ["/app/run_metabase.sh"]
