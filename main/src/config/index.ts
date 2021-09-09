import* as dotenv from 'dotenv';

dotenv.config();

let databaseUrl = process.env.MONGODB_URI;


export default {
  databaseURL: databaseUrl,
};