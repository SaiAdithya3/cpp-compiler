const {exec} = require("child_process");
const fs = require("fs");
const path = require("path");
const { stdout } = require("process");

const outputPath = path.join(__dirname,"outputs");

if(!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, {recursive: true});  
}

const executeCpp = (filepath) => {
    const jobId = path.basename(filepath).split(".")[0];
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject)=>{
        exec(`g++ ${filepath} -o ${outPath} && cd ${outputPath} && ${jobId}.exe`,
        (error, stdout, stderr)=>{
            error && reject({ error, stderr });
            stderr && reject(stderr);
            resolve(stdout);
        });
        // exec(`g++ ${filepath} -o ${outPath} && cd ${outPath} && ./${codeId}.out`,
        // (err, stdout, stderr)=>{
        //     if(err) {
        //         reject({err, stderr});
                
        //     }
        //     if(stderr) {
        //         reject(stderr);
        //     }
        //     resolve(stdout);
        // });
    });


};

module.exports = {
    executeCpp,
};