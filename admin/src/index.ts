import * as express from 'express';
import * as cors from 'cors';
import {createConnection} from 'typeorm'

createConnection().then(db => {
    const app = express();

    app.use(cors());
    app.use(express.json())
    
    const PORT = process.env.PORT || 5000;
    app.listen(5000, () => {
        console.log(`Server running on port ${PORT} `);
      });
})
