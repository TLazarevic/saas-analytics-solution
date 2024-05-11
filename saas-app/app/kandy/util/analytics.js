const { jitsuAnalytics } = require('@jitsu/js');

const jitsu = jitsuAnalytics({
    host: "http://localhost:8080",
    writeKey: "u82ByV5Vbr4EL5KOuyjQgoUfoXrZKlcs:Q6qVs9syFPhOVOFuv0sGiHXUzDvqlJHM",
});

async function track(event_name, properties) {
    console.log("Emitting analytics event.", event_name, properties)
    await jitsu.track(event_name, properties);
}

async function identify(user_id) {
    console.log("Identifying user for analytic pirposes.", user_id)
    await jitsu.identify(user_id);
}

module.exports = { track, identify };
