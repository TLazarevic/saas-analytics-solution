const { jitsuAnalytics } = require('@jitsu/js');

const jitsu = jitsuAnalytics({
    host: "http://localhost:8080",
    writeKey: process.env.WRITE_KEY_JITSU,
});

async function track(event_name, properties) {
    console.log("Emitting analytics event.", event_name, properties)
    await jitsu.track(event_name, properties);
}

async function identify(user_id) {
    console.log("Identifying user for analytics.", user_id)
    await jitsu.identify(user_id);
}

module.exports = { track, identify };
