// Ultra-minimal test function
export const handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Hello from serverless function!',
            timestamp: new Date().toISOString(),
            event: event.path,
            method: event.httpMethod
        })
    };
};
