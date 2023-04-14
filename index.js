

import weaviate from 'weaviate-ts-client';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
const client = new weaviate.client({
    scheme: 'http',
    host: 'localhost:8080'
});

const schemaRes = await client.schema.getter().do();

console.log(schemaRes);

const schemaConfig = {
    'class': 'Meme',
    'vectorizer' : 'img2vec-neural',
    'vectorIndexType' : 'hnsw',
    'moduleConfig' : {
        'img2vec-neural' : {
            'imageFields': [
                'image'
            ]
        }
    },
    'properties': [
        {
            'name': 'image',
            'dataType': ['blob'],
        },
        {
            'name': 'text',
            'dataType': ['string'],
        }
    ]
}

await client.schema
    .classCreator()
    .withClass(schemaConfig)
    .do();


const test = Buffer.from( readFileSync('./test.jpeg') ).toString('base64');

const resImage = await client.graphql.get()
    .withClassName('Meme')
    .withFields([ 'image' ])
    .withNearImage({image: test})
    .withLimit(1)
    .do();

    if (!resImage.data.Get.Meme || !resImage.data.Get.Meme[0] || !resImage.data.Get.Meme[0].image) {
        console.error('Error: could not retrieve image data');
      } else {
        const result = resImage.data.Get.Meme[0].image;
        writeFileSync('./result.jpg', result, 'base64');
      }
// //upload a single image to vector database
// await client.schema
//     .classCreator()
//     .withClass(schemaConfig)
//     .do();

// const img = readFileSync('./img/img.webp');

// const b64 = Buffer.from(img).toString('base64');

// const res = await client.data.creator()
//     .withClass('Meme')
//     .withProperties({
//         image: b64,
//         text: 'Rage Meme'
//     })
//     .do();



// upload multiple images to vector database from img folder
const imgFiles = readdirSync('./img');

const promises =  imgFiles.map(async (imgFile) => {
    const b64 = toBase64(`./img/${imgFile}`);


    await client.data.creator()
        .withClass('Meme')
        .withProperties({
            image: b64,
            text: imgFile
        })
        .do();
});
