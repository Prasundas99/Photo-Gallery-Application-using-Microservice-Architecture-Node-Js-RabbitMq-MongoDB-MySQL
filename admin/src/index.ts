import * as express from 'express';
import { Request, Response } from 'express'
import * as cors from 'cors';
//For DB
import { createConnection } from 'typeorm'
import { Product } from './entity/product';
//For eventQueue
import * as amqp from 'amqplib/callback_api';

import config from './config'


createConnection().then(db => {
    //db details
    const productRepository = db.getRepository(Product);

    //Rabbitmq connection
    amqp.connect(config.rabbitmqUrl, (error, connection) => {
        if (error)  
            throw error

        connection.createChannel((error1, channel) => {
            if (error1)
                 throw error1
            
            //Consuming event
            channel.assertQueue('product_liked', {durable: true})     
        
            const app = express();
            app.use(cors());
            app.use(express.json())

            //Consumers
            channel.consume('product_liked', async(msg) => {
                const eventProduct = JSON.parse(msg.content.toString())
                const StoredProduct = await productRepository.findOne({id: eventProduct.admin_id})
                productRepository.merge(StoredProduct,{
                    likes: eventProduct.likes
                })
                await productRepository.save(StoredProduct)
                console.log("Like incremented");
            }, { noAck: true })


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
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
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
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
                return res.send(result);
            })

            //Delete a single product
            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id);
                channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
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
            app.listen(config.port, () => {
                console.log(`Server running on port ${config.port} `);
            });
            //Existing rabbitMQ server on closing
            process.on('beforeExit', () => {
                console.log("Closing");
                connection.close();
            })
        })

    })
})


