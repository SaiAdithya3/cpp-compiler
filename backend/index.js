const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');

const {generateFile} = require('./generateFile');
const {executeCpp} = require('./executeCpp');
const {executePy} = require('./executePy');
const {addJobToQueue} = require("./jobQueue");
const Job = require("./models/Job");

mongoose.connect("mongodb://saiadithya:sri2928@cluster0-shard-00-00.dov8s.mongodb.net:27017,cluster0-shard-00-01.dov8s.mongodb.net:27017,cluster0-shard-00-02.dov8s.mongodb.net:27017/compilerapp?ssl=true&replicaSet=atlas-4vv6bs-shard-0&authSource=admin&retryWrites=true&w=majority",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
},(err)=>{
    if(err) {
        console.log(err);
        process.exit(1);
    }
    console.log("Successfully connected to mongodb!");
});

const app = express();

app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.listen(5000, () => {
    console.log(`Listening on port 5000!`);
});

app.post("/run", async (req,res)=>{
    const {language="cpp ",code} = req.body;
    console.log(language, "Length:", code.length);
    if(code===undefined){
        return res.status(400).json({success:false, error: "No code!"});
    }

    let job;
    try{

        
        const filepath = await generateFile(language, code);
        job = await new Job({language,filepath}).save();
        const jobId = job["_id"];
        addJobToQueue(jobId);
        console.log(job);

        res.status(201).json({success: true, jobId}); 

        let output;

        job["startedAt"] = new Date();
        if(language==='cpp'){
            output = await executeCpp(filepath);
        } else {
            output = await executePy(filepath);
        } 

        job["completedAt"] = new Date();
        job["status"] = "success";
        job["output"] = output;

        await job.save();
        console.log(job);
        // return res.json({filepath, output});
    } catch(err){
        job["completedAt"] = new Date();
        job["status"] = "error";
        job["output"] = JSON.stringify(err);
        await job.save();
        console.log(job);
        res.status(500).json({err});
    }
});

app.get("/status", async (req, res) => {
    const jobId = req.query.id;
    console.log("status requested", jobId);
  
    if (jobId === undefined) {
      return res
        .status(400)
        .json({ success: false, error: "missing id query param" });
    }
    try{

        const job = await Job.findById(jobId);
        
        if (job === undefined) {
            return res.status(404).json({ success: false, error: "invalid job id" });
        }
        return res.status(200).json({success: true,job});
    } catch(err) {

        console.log(err);
        return res.status(400).json({ success: false, error: JSON.stringify(err) });
    }
  });
