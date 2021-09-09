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


    //endpoints

    //Get all products
    app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find();
        res.json(products)
    })

    app.post('/api/products', async (req: Request, res: Response) => {
        const product = await productRepository.create(req.body);
        const result = await productRepository.save(product);
        res.send(result);
    })

    //Get single product from list of product
    app.get('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.findOne(req.params.id);
        res.send(product)
    })


    //server at PORT 5000
    const PORT = process.env.PORT || 5000;
    app.listen(5000, () => {
        console.log(`Server running on port ${PORT} `);
    });
})
