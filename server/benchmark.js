const { performance } = require('perf_hooks');
const express = require('express');
const axios = require('axios');
const http = require('http');

// Override axios.post BEFORE requiring apiRouter, though since it's cached it doesn't matter much.
const originalAxiosPost = axios.post;
axios.post = async (url, data) => {
    if (url.includes('8000/api/agent/chat')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            data: {
                cart: [],
                fallback_items: [],
                total_inr: 100,
                audit_trace: [],
                is_approved: true,
                payment_link_url: 'http://example.com/pay'
            }
        };
    }
    return originalAxiosPost(url, data);
};

const apiRouter = require('./routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

// Mock the models
const AuditLog = require('./models/AuditLog');
AuditLog.create = async () => {
    // Simulate some I/O delay for creating an audit log
    await new Promise(resolve => setTimeout(resolve, 50));
};

const runBenchmark = async () => {
    let server;
    await new Promise(resolve => {
        server = app.listen(0, resolve);
    });
    const port = server.address().port;

    const iterations = 50;
    const times = [];

    // Warmup
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port,
                path: '/api/chat',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, res => {
                res.on('data', () => {});
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(JSON.stringify({ message: 'test', sessionId: 'test', spendLimit: 1000 }));
            req.end();
        });
    }

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port,
                path: '/api/chat',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, res => {
                res.on('data', () => {});
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(JSON.stringify({ message: 'test', sessionId: 'test', spendLimit: 1000 }));
            req.end();
        });
        const end = performance.now();
        times.push(end - start);
    }

    server.close();

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average time: ${avg.toFixed(2)} ms`);
};

runBenchmark().catch(console.error);
