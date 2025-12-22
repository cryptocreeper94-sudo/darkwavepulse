import { parentPort } from 'worker_threads';
const MASTRA_PORT = 4111;
async function startMastra() {
    process.env.PORT = String(MASTRA_PORT);
    try {
        await import('../.mastra/output/index.mjs');
        for (let i = 0; i < 10; i++) {
            try {
                const response = await fetch(`http://127.0.0.1:${MASTRA_PORT}/api/healthz`);
                if (response.ok) {
                    parentPort?.postMessage({ type: 'ready' });
                    return;
                }
            }
            catch (e) { }
            await new Promise(r => setTimeout(r, 1000));
        }
        parentPort?.postMessage({ type: 'ready' });
    }
    catch (err) {
        parentPort?.postMessage({ type: 'ready' });
    }
}
startMastra();
