const express = require('express');
const { Worker, DefaultLogger } = require('@temporalio/worker');
const { Connection } = require('@temporalio/grpc-commonjs');
const { MessageSignerWorkflow } = require('./workflows');

const app = express();
const port = 3000;

// Generate a random keypair on service startup
const keypair = generateRandomKeypair();

// Temporal Worker setup
const connection = new Connection();
const worker = new Worker({
  workflows: [MessageSignerWorkflow],
  taskQueue: 'message-signer-task-queue',
  logger: new DefaultLogger('INFO'),
});
worker.addModule(require.resolve('./workflows'));

// Start the Express server
app.use(express.json());

// Endpoint to initiate the message signing process
app.post('/sign-message/:uuid', async (req, res) => {
  const { message } = req.body;
  const { uuid } = req.params;

  // Start the workflow
  await MessageSignerWorkflow.execute({ message, uuid, keypair });

  res.status(200).json({ status: 'Signing process initiated' });
});

// Endpoint to check the status of the signing process
app.get('/status/:uuid', async (req, res) => {
  const { uuid } = req.params;

  // Query the workflow status
  const status = await MessageSignerWorkflow.query({ uuid });

  if (status === 'completed') {
    const signedMessage = await MessageSignerWorkflow.getResult({ uuid });
    res.status(200).json({ status, signedMessage });
  } else {
    res.status(200).json({ status });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Function to generate a random keypair (replace with actual key generation logic)
function generateRandomKeypair() {
  return {
    publicKey: 'randomPublicKey',
    privateKey: 'randomPrivateKey',
  };
}
