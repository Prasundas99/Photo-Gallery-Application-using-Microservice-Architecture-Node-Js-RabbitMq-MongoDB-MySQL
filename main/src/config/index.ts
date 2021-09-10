import* as dotenv from 'dotenv';

dotenv.config();

let databaseUrl = process.env.MONGODB_URI;


export default {
  databaseURL: databaseUrl,
  port: process.env.PORT || 5001,
  rabbitmqUrl: process.env.RABBITMQ_URL,
};