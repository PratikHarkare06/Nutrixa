const clients = new Map();

const addClient = (id, res) => {
  clients.set(id, res);
  req = res.req;
  req.on('close', () => {
    clients.delete(id);
  });
};

const emitProgress = (id, stage, message) => {
  const res = clients.get(id);
  if (res) {
    res.write(`data: ${JSON.stringify({ stage, message })}\n\n`);
  }
};

module.exports = { addClient, emitProgress };
