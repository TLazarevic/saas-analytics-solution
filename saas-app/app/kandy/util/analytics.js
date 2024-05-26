const { jitsuAnalytics } = require('@jitsu/js');

const { logger } = require('structlog');

const jitsu = jitsuAnalytics({
    host: "http://localhost:8080",
    writeKey: process.env.WRITE_KEY_JITSU,
});

async function track(event_name, properties) {
    try {
        logger.info("Emitting analytics event.", { "event_name": event_name });
        return await jitsu.track(event_name, properties);
    } catch (error) {
        logger.error("Error emitting analytics.", error)
    }
}

async function identify(user_id) {
    try {
        logger.info("Identifying user for analytics.", { "user_id": user_id });
        return await jitsu.identify(user_id);
    } catch (error) {
        logger.error("Error emitting analytics.", error)
    }
}

module.exports = { track, identify };
