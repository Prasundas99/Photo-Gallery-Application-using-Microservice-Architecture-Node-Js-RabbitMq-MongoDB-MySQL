import * as express from 'express';
import { Request, Response } from 'express'
import * as cors from 'cors';

import { createConnection } from 'typeorm'
import { Product } from './entity/product';

import * as amqp from 'amqplib/callback_api';

import* as dotenv from 'dotenv';

dotenv.config();


createConnection().then(db => {
    //db details
    const productRepository = db.getRepository(Product);

    //Rabbitmq connection
    amqp.connect(process.env.RABBITMQ_URL, (error, connection) => {
        if (error) {
            throw error
        }

        connection.createChannel((error1, channel) => {
            if(error1) {
                throw error1
            }
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

            //Create a single product to db
            app.post('/api/products', async (req: Request, res: Response) => {
                const product = await productRepository.create(req.body);
                const result = await productRepository.save(product);
                return res.send(result);
            })

            //Get single product from list of product
            app.get('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id);
                return res.send(product)
            })

            //Update a single product from list of product
            app.put('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id);
                productRepository.merge(product, req.body);
                const result = await productRepository.save(product);
                return res.send(result);
            })

            //Delete a single product
            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id);
                return res.send(result);
            })

            //Request where we like the product
            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id);
                product.likes++;
                const result = await productRepository.save(product);
                return res.send(result);
            })


            //server at PORT 5000
            const PORT = process.env.PORT || 5003;
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT} `);
            });
        })

    })
})


