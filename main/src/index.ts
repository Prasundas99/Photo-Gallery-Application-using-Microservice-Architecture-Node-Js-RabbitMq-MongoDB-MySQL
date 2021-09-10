import * as express from 'express';
import { Request, Response } from 'express'
import * as cors from 'cors';
import axios from 'axios'

import { createConnection } from 'typeorm'
import { Product } from './entity/product';

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
            channel.assertQueue('product_created', { durable: false })
            channel.assertQueue('product_updated', { durable: false })
            channel.assertQueue('product_deleted', { durable: false })


            const app = express();
            app.use(cors());
            app.use(express.json())


            //Consummers
            channel.consume('product_created', async (msg) => {
                const eventProduct: Product = JSON.parse(msg.content.toString())
                const product = new Product()
                product.admin_id = parseInt(eventProduct.id)
                product.title = eventProduct.title
                product.image = eventProduct.image
                product.likes = eventProduct.likes
                await productRepository.save(product)
                console.log('product created')
            }, { noAck: true })

            channel.consume('product_updated', async (msg) => {
                const eventProduct: Product = JSON.parse(msg.content.toString())
                const product = await productRepository.findOne({ admin_id: parseInt(eventProduct.id) })
                productRepository.merge(product, {
                    title: eventProduct.title,
                    image: eventProduct.image,
                    likes: eventProduct.likes
                })
                await productRepository.save(product)
                console.log('product updated')
            }, { noAck: true })

            channel.consume('product_deleted', async (msg) => {
                const admin_id = parseInt(msg.content.toString())
                await productRepository.delete({ admin_id })
                console.log('product deleted')
            })

            //endpoints

            //Get all products
            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find()
                return res.send(products)
            })

            //calling internal api via http call
            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id)
                await axios.post(`http://localhost:5000/api/products/${product.admin_id}/like`, {})
                product.likes++
                await productRepository.save(product)
                return res.send(product)
            });


            //server at PORT 5000
            const PORT = config.port;
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT} `);
            });
            process.on('beforeExit', () => {
                console.log("Closing");
                connection.close();
            })
        })

    })
})


