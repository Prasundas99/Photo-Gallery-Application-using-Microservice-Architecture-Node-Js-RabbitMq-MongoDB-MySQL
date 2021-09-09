import * as express from 'express';
import { Request, Response } from 'express'
import * as cors from 'cors';
import { createConnection } from 'typeorm'
import { Product } from './entity/product';


createConnection().then(db => {
    //db details
    const productRepository = db.getRepository(Product);

    const app = express();
    //middlewares
    app.use(cors());
    app.use(express.json())

    

    //server at PORT 5001
    const PORT = process.env.PORT || 5001;
    app.listen(5000, () => {
        console.log(`Server running on port ${PORT} `);
    });
})
