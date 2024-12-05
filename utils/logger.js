class Logger {
    constructor() {
        this.debugEnabled = process.env.DEBUG === 'true';
    }

    info(message, data = {}) {
        console.log('\n🔵', message);
        if (Object.keys(data).length > 0) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    error(message, error) {
        console.error('\n🔴', message);
        if (error) {
            if (error instanceof Error) {
                console.error(error.stack || error.message);
            } else {
                console.error(JSON.stringify(error, null, 2));
            }
        }
    }

    debug(message, data = {}) {
        if (this.debugEnabled) {
            console.log('\n🟣', message);
            if (Object.keys(data).length > 0) {
                console.log(JSON.stringify(data, null, 2));
            }
        }
    }

    success(message, data = {}) {
        console.log('\n✅', message);
        if (Object.keys(data).length > 0) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    warning(message, data = {}) {
        console.log('\n⚠️', message);
        if (Object.keys(data).length > 0) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

export const logger = new Logger();
