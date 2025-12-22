import { parentPort } from 'worker_threads';

const MASTRA_PORT = 4111;

async function startMastra(): Promise<void> {
  console.log('[Worker] Starting Mastra backend...');
  process.env.PORT = String(MASTRA_PORT);
  
  try {
    await import('../.mastra/output/index.mjs');
    console.log('[Worker] Mastra module imported');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${MASTRA_PORT}/api/healthz`);
        if (response.ok) {
          console.log('[Worker] Mastra backend ready!');
          parentPort?.postMessage({ type: 'ready' });
          return;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('[Worker] Mastra timeout - enabling anyway');
    parentPort?.postMessage({ type: 'ready' });
  } catch (err) {
    console.error('[Worker] Mastra failed:', err);
    parentPort?.postMessage({ type: 'ready' });
  }
}

startMastra();
