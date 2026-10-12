/**
 * Reprocessa a fila de leads pendentes.
 * Uso:  npm run reprocessar
 * (necessário ter ULTRA_WEBHOOK_URL ou ULTRA_API_URL configurados)
 */
import { reprocessarFila } from './integracao.js';

const resultado = await reprocessarFila();
console.log('Fila reprocessada:', resultado);
