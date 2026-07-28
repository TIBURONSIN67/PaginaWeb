function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info(msg) {
    console.log(`[${timestamp()}] [INFO] ${msg}`);
  },
  warn(msg) {
    console.warn(`[${timestamp()}] [WARN] ${msg}`);
  },
  error(msg, err) {
    console.error(`[${timestamp()}] [ERROR] ${msg}`, err || '');
  },
  incoming(phone, name, msg) {
    console.log(`[${timestamp()}] [INCOMING] ${phone} (${name}): ${msg}`);
  },
  outgoing(phone, response) {
    console.log(`[${timestamp()}] [OUTGOING] To ${phone}: ${response}`);
  },
  openai(request) {
    console.log(`[${timestamp()}] [OPENAI] Request sent to OpenAI API`);
  },
  toolCall(name, params) {
    console.log(`[${timestamp()}] [TOOL] ${name}: ${JSON.stringify(params)}`);
  },
  inventory(movement) {
    console.log(`[${timestamp()}] [INVENTORY] ${movement}`);
  },
  order(msg) {
    console.log(`[${timestamp()}] [ORDER] ${msg}`);
  }
};
