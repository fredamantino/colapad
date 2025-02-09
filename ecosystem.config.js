module.exports = {
    apps: [
        {
            name: 'onote',
            script: './server.js',
            env: {
                NODE_ENV: 'production',
                MONGODB_URI: 'mongodb+srv://fredamantino:facafelpuda@clusternp0.rbxdsot.mongodb.net/?retryWrites=true&w=majority&appName=ClusterNP0'
            }
        }
    ]
};
