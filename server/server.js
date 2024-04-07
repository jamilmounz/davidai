const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require("openai");
const path = require('path');
const { connectDB, Asset, Conversation } = require('./db'); // Import from db.js
require('dotenv').config();
const cors = require('cors');


const api_key = process.env.OPENAI_API_KEY


const app = express();
const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'client/build')));


app.use(bodyParser.json());
app.use(cors());
connectDB(); // Connect to MongoDB

const openai = new OpenAI({
    apiKey: api_key,
});



app.post('/talk', async (req, res) => {
    try {
        const prompt = req.body.query;
        let conversation = await Conversation.findOne();
        if (!conversation) {
            conversation = new Conversation({ history: [] });
        }

        conversation.history.push({ role: "user", content: prompt });

        // Assuming a max number of messages to prevent loading too large of a history
        //const historyMessages = conversation.history.slice(-50); 

        const historyforapi = conversation.history.map(msg => ({ role: msg.role, content: msg.content }));

        const initialMessages = [
            { role: "system", content: "A company wants to track its assets with your help. You will be managing the assets in this company and your name is David" },
            { role: "assistant", content: 'The user will give you an asset or many assets with an ID,' +
            'Department and date bought and additional notes. I want you to separate the assets each one with' +
            'its own ID and categories automatically and then give it back to me after separating the ' +
            'categories as a message in the following form: (Asset added): Asset name, Asset ID, Department, '+
            'Date bought, Additional notes. I dont want you to show the categories in the message given back. '+
            'Just order them as i told you without writing the categories. Just order them with commas in'+
            'between with NO CATEGORIES.'+
            'The second possibility is the user will ask you to add several assets at the same time and giving'+
            'an ID Range. For example add 30 Laptops and ID them from 1-30. I want you to separate them in'+
            'categories like before but now in the following form: (Several Assets added): Base ID, End ID, Asset name'+
            'Department, Date bought, Additional notes. Asset name needs to be singular and not plural! '+
            'The third possibility is that the user will want to '+
            'update an assets location, like in which department it is and the notes in it. For example, '+
            'A laptop with ID 22 was given to Alex from the HR Department. The Laptop was given on Dec. 12.'+
            'Here the information that it was given to Alex and on Dec. 12 are additional notes. I then want '+
            'you to separate them in categories like before but now in the following form: '+
            '(Update Asset): Asset name, ID, new Department, new Additional notes.' +
        'i will feed you back the conversations with the user and i want you to use these conversations to answer questions such as who has most laptops' +
    'i want you to use all the conversations as a source of information, depend on the conversation to give reports of the assets with their respective IDs or answer questions regarding the additional notes saved with the assets. I know you do not have list of assets, but still you can answer the history of conversations. i want you to be carefull to changes taking place to certain assets, like if they have been ever given to other department or something like that'}
        ];

        const messagesToSend = [...initialMessages, ...historyforapi, { role: "user", content: prompt }];

        
        const completion = await openai.chat.completions.create({
            messages: messagesToSend,
            model: "gpt-3.5-turbo",
        });

        const airesponse = completion.choices[0].message.content;
        console.log(completion.choices[0].message.content);

        conversation.history.push({ role: "assistant", content: `${airesponse}` }); 
        await conversation.save();
        
        if (airesponse.includes("Asset added")) {
            // Extract and parse asset details from message, then save to MongoDB
            const [name, ID, Department, date, notes] = airesponse.split("(Asset added):")[1].trim().split(",");
            const newAsset = new Asset({ name, ID, Department, date, notes });
            await newAsset.save();
            res.json({ status: "success", message: ` ${airesponse} Asset added: ${name}` });
        } else if (airesponse.includes("Several Assets added")){
            const [baseID, endID, name, Department, date, notes] = airesponse.split("(Several Assets added):")[1].trim().split(",");
            const intbaseID = parseInt(baseID, 10);
            const intendID = parseInt(endID, 10);
            let addedCount = 0;
            try {
                for (let i = 0; i < intendID; i++) {
                    const newAsset = new Asset({ ID: intbaseID + i, name, Department, date, notes });
                    await newAsset.save();
                    addedCount++;
                }
                res.json({ status: "success", message:  ` ${airesponse} ${addedCount} assets added successfully.` });
            } catch (error) {
                console.error("Error adding assets:", error);
                res.status(500).json({ status: "error", airesponse: "Internal server error." });
            }
        } else if(airesponse.includes("Update Asset")) {
            const [name, ID, newDepartment, newNotes] = airesponse.split("(Update Asset):")[1].trim().split(",");
            try {
                const updatedAsset = await Asset.findOneAndUpdate({ ID: ID.trim() }, { Department: newDepartment.trim(), notes: newNotes.trim()}, { new: true });
                res.json({ status: "success", message: ` ${airesponse} Asset updated: ${updatedAsset.name}` });
            } catch (error) {
                console.error("Error updating asset:", error);
                res.status(500).json({ status: "error", message: "Internal server error." });
            }
        }else {
            res.json({ status: "success", message: ` ${airesponse}` });
        }
    } catch (error) {
        console.error("Error communicating with OpenAI or MongoDB:", error);
        res.status(500).json({ status: "error", message: "Internal server error." });
    }
});





app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
