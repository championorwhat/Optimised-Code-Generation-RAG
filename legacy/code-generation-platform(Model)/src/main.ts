import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { setupRoutes } from './api/routes';
import { PipelineService } from './services/pipelineService';

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Create core services
const pipelineService = new PipelineService();

// Register routes
setupRoutes(app, pipelineService);

// Port from env or default
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(PORT, () => {
  console.log(`Pipeline server running on http://localhost:${PORT}`);
});
